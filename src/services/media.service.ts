import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import { S3Client } from "@aws-sdk/client-s3";
import { AwsAccessKey, AwsRegion, AwsSecretKey } from "../configs";

export default class MediaService {
  private s3;
  private cloudFront;

  constructor() {
    this.s3 = new S3Client({
      region: AwsRegion,
      credentials: {
        accessKeyId: AwsAccessKey,
        secretAccessKey: AwsSecretKey,
      },
    });
    this.cloudFront = new CloudFrontClient({
      region: AwsRegion,
      credentials: {
        accessKeyId: AwsAccessKey,
        secretAccessKey: AwsSecretKey,
      },
    });
  }


  
}
