from worker.services.ads import AdsClient
from worker.services.secret import read_secrets

if __name__ == "__main__":
    print("Starting")
    read_secrets()
    ads_client = AdsClient()
    df_keywords, _ = ads_client.get_keyword_info(["test"])
    print(df_keywords)
    print("Success")
