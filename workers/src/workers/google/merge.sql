CREATE OR REPLACE TEMP TABLE edges (
    u INT64,
    v INT64
) CLUSTER BY 
    u,
    v
AS (
    WITH
        all_keywords AS (
            SELECT
                keyword,
                avg_monthly_searches,
                updated_at,
                FARM_FINGERPRINT (
                    CONCAT (
                        CAST(COALESCE(avg_monthly_searches, 0) AS STRING),
                        CAST(COALESCE(updated_at, DATE '1970-01-01') AS STRING),
                        CAST(COALESCE(competition_index, 0) AS STRING),
                        COALESCE(TO_HEX (volume_history), ''),
                        CAST(COALESCE(cpc_high, 0) AS STRING),
                        CAST(COALESCE(cpc_low, 0) AS STRING),
                        CAST(COALESCE(cpc_avg, 0) AS STRING)
                    )
                ) AS group_id
            FROM
                `keywords.keywords-tmp`
            UNION ALL
            SELECT
                keyword,
                avg_monthly_searches,
                updated_at,
                group_id
            FROM
                `keywords.keywords`
        ),
        deduped_keywords AS (
            SELECT
                keyword,
                avg_monthly_searches,
                updated_at,
                group_id
            FROM
                all_keywords QUALIFY ROW_NUMBER() OVER (
                    PARTITION BY
                        keyword,
                        group_id
                    ORDER BY
                        updated_at DESC
                ) = 1
        ),
        high_volume_keywords AS (
            SELECT
                *
            FROM
                deduped_keywords
            WHERE
                COALESCE(avg_monthly_searches, 0) > 1000
        )
    SELECT DISTINCT
        k1.group_id AS u,
        k2.group_id AS v
    FROM
        high_volume_keywords k1
        JOIN high_volume_keywords k2 ON k1.keyword = k2.keyword
        AND k1.group_id != k2.group_id
);

CREATE OR REPLACE TEMP TABLE `groups` AS
WITH RECURSIVE
    cc AS (
        SELECT
            u,
            v,
            1 AS depth
        FROM
            edges
        UNION ALL
        SELECT
            e.u,
            c.v,
            c.depth + 1
        FROM
            edges e
            JOIN cc c ON c.u = e.v
        WHERE
            c.depth < 3
            AND e.u != c.v
    )
SELECT
    u AS group_id,
    MIN(v) AS final_group_id
FROM
    cc
GROUP BY
    u;

CREATE OR REPLACE TEMP TABLE merge_data AS
WITH
    all_keywords AS (
        SELECT
            keyword,
            avg_monthly_searches,
            competition_index,
            cpc_high,
            volume_history,
            updated_at,
            ingested_at,
            FARM_FINGERPRINT (
                CONCAT (
                    CAST(COALESCE(avg_monthly_searches, 0) AS STRING),
                    CAST(COALESCE(updated_at, DATE '1970-01-01') AS STRING),
                    CAST(COALESCE(competition_index, 0) AS STRING),
                    COALESCE(TO_HEX (volume_history), ''),
                    CAST(COALESCE(cpc_high, 0) AS STRING),
                    CAST(COALESCE(cpc_low, 0) AS STRING),
                    CAST(COALESCE(cpc_avg, 0) AS STRING)
                )
            ) AS group_id
        FROM
            `keywords.keywords-tmp`
        UNION ALL
        SELECT
            keyword,
            avg_monthly_searches,
            competition_index,
            cpc_high,
            volume_history,
            updated_at,
            ingested_at,
            group_id
        FROM
            `keywords.keywords`
    ),
    deduped_keywords AS (
        SELECT
            keyword,
            avg_monthly_searches,
            competition_index,
            cpc_high,
            volume_history,
            updated_at,
            ingested_at,
            group_id
        FROM
            all_keywords QUALIFY ROW_NUMBER() OVER (
                PARTITION BY
                    keyword,
                    group_id
                ORDER BY
                    updated_at DESC
            ) = 1
    ),
    high_volume_keywords AS (
        SELECT
            d.keyword,
            d.avg_monthly_searches,
            d.competition_index,
            d.cpc_high,
            d.volume_history,
            d.updated_at,
            d.ingested_at,
            COALESCE(g.final_group_id, d.group_id) AS group_id
        FROM
            deduped_keywords d
            LEFT JOIN `groups` g ON d.group_id = g.group_id
        WHERE
            COALESCE(d.avg_monthly_searches, 0) > 1000
    ),
    low_volume_keywords AS (
        SELECT
            keyword,
            avg_monthly_searches,
            competition_index,
            cpc_high,
            volume_history,
            updated_at,
            ingested_at,
            NULL AS group_id
        FROM
            deduped_keywords
        WHERE
            COALESCE(avg_monthly_searches, 0) <= 1000
    ),
    
    combined_keywords AS (
        SELECT
            *
        FROM
            high_volume_keywords
        UNION ALL
        SELECT
            *
        FROM
            low_volume_keywords
    )
SELECT
    keyword,
    avg_monthly_searches,
    competition_index,
    cpc_high,
    volume_history,
    updated_at,
    ingested_at,
    group_id
FROM
    combined_keywords QUALIFY ROW_NUMBER() OVER (
        PARTITION BY
            keyword
        ORDER BY
            updated_at DESC
    ) = 1;

MERGE `keywords.keywords` keywords USING merge_data tmp ON keywords.keyword = tmp.keyword WHEN MATCHED THEN
UPDATE
SET
    avg_monthly_searches = tmp.avg_monthly_searches,
    competition_index = tmp.competition_index,
    cpc_high = tmp.cpc_high,
    volume_history = tmp.volume_history,
    updated_at = tmp.updated_at,
    ingested_at = CASE
        WHEN tmp.ingested_at IS NULL THEN keywords.ingested_at
        ELSE tmp.ingested_at
    END,
    group_id = tmp.group_id WHEN NOT MATCHED THEN INSERT (
        keyword,
        avg_monthly_searches,
        competition_index,
        cpc_high,
        volume_history,
        updated_at,
        ingested_at,
        group_id
    )
VALUES
    (
        keyword,
        avg_monthly_searches,
        competition_index,
        cpc_high,
        volume_history,
        updated_at,
        ingested_at,
        group_id
    );