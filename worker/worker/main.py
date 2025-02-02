from worker.context import Context

if __name__ == "__main__":
    ctx = Context()
    df_keywords, _ = ctx.ads_client.get_keyword_info(["test"])
    ctx.logger.info(str(df_keywords))
    ctx.logger.info("Success")
