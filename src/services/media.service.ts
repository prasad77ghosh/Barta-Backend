import { UploadedFile } from "express-fileupload";
import { NotAcceptable } from "http-errors";
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import fs from "fs";
import {
  AwsAccessKey,
  AwsBucketName,
  AwsRegion,
  AwsSecretKey,
  CloudFrontDistId,
  CloudFrontUrl,
} from "../configs";
import sharp from "sharp";

export class MediaStoreService {
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

  public async upload({
    files,
    folder,
  }: {
    files: UploadedFile;
    folder: string;
  }): Promise<
    | {
        key: string;
        Location: string;
        allData: any;
      }
    | boolean
  > {
    return new Promise(async (resolve, reject) => {
      try {
        const fileSplit = files.name.split(".");
        const fileType = fileSplit[fileSplit.length - 1];
        const fileName = `${new Date().getTime()}.${fileType}`;

        // compress logic
        const compressionOptions = {
          width: 800,
          quality: 50,
        };
        let fileBuffer: Buffer;
        if (files.mimetype.startsWith("image/")) {
          let sharpInstance = sharp(files.data);
          if (compressionOptions.width) {
            sharpInstance = sharpInstance.resize(
              compressionOptions.width,
              null,
              {
                fit: sharp.fit.inside,
                withoutEnlargement: true,
              }
            );
          }

          if (fileType === "jpeg" || fileType === "jpg") {
            fileBuffer = await sharpInstance
              .jpeg({ quality: compressionOptions.quality || 80 })
              .toBuffer();
          } else if (fileType === "png") {
            fileBuffer = await sharpInstance
              .png({ compressionLevel: 9 })
              .toBuffer();
          } else if (fileType === "webp") {
            fileBuffer = await sharpInstance
              .webp({ quality: compressionOptions.quality || 80 })
              .toBuffer();
          } else {
            fileBuffer = await sharpInstance.toBuffer();
          }
        } else {
          fileBuffer = Buffer.from(files.data);
        }

        const params = {
          Bucket: `${AwsBucketName}`,
          Key: `${folder}/${fileName}`,
          Body: fileBuffer,
          ContentType: files.mimetype,
          ContentLength: fileBuffer.length,
        };

        const objectSetUp = new PutObjectCommand({
          ...params,
        });
        const data = await this.s3.send(objectSetUp);
        await this.invalidateFileCache(`${params?.Key}`);

        return resolve({
          key: `${CloudFrontUrl}/${params?.Key}`,
          Location: `${params?.Key}`,
          allData: data,
        });
      } catch (error) {
        return resolve(false);
      }
    });
  }

  private async invalidateFileCache(filename: string) {
    try {
      const path = [`/${filename}`];
      const cmd = new CreateInvalidationCommand({
        DistributionId: CloudFrontDistId,
        InvalidationBatch: {
          CallerReference: new Date().getTime().toString(),
          Paths: { Quantity: path.length, Items: path },
        },
      });
      await this.cloudFront.send(cmd);
    } catch (error) {
      return false;
    }
  }

  async delete({ key }: { key: string }): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          Bucket: `${AwsBucketName}`,
          Key: key,
        };

        const deleteData = new DeleteObjectCommand({
          ...params,
        });
        // DELETE FROM S3 BUCKET
        await this.s3.send(deleteData);
        // INVALIDATE THE CLOUD FRONT CACHE
        await this.invalidateFileCache(key);
        return resolve(true);
      } catch (error) {
        new Error();
        return resolve(false);
      }
    });
  }

  async updateImage({ path, file }: { file: any; path: string }): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          Bucket: `${AwsBucketName}`,
          Key: path,
          Body: file?.data,
          ContentType: file.mimetype,
        };

        const objectSetUp = new PutObjectCommand({
          ...params,
        });
        const data = await this.s3.send(objectSetUp);

        await this.invalidateFileCache(path);

        return resolve(data);
      } catch (error) {
        new Error();
        return resolve(false);
      }
    });
  }

  async newUpload({ file, dir }: { file: any; dir: string }) {
    const fileSplit = file.name.split(".");
    const fileType = fileSplit[fileSplit.length - 1];
    const fileName = `${new Date().getTime()}.${fileType}`;
    const params = {
      Bucket: `${AwsBucketName}`,
      Key: `${dir}/${fileName}`,
      Body: file?.data,
      ContentType: file.mimetype,
    };

    const multipartUploadResponse = await this.s3.send(
      new CreateMultipartUploadCommand(params)
    );
    const uploadId = multipartUploadResponse.UploadId;

    const fileSize = fs.statSync(file?.data).size;
    const partSize = 1024 * 1024 * 1; // 5 MB per part

    // Divide the file into parts
    const numParts = Math.ceil(fileSize / partSize);

    // Upload each part
    const partPromises = [];
    for (let i = 0; i < numParts; i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize, fileSize);

      const partParams = {
        ...params,
        UploadId: uploadId,
        PartNumber: i + 1,
        Body: fs.createReadStream(file?.data, { start, end }),
        ContentLength: end - start,
      };

      const partPromise = this.s3.send(new UploadPartCommand(partParams));
      partPromises.push(partPromise);
    }

    // Wait for all parts to upload
    const data = await Promise.all(partPromises);

    const parts = data.map(({ ETag, PartNumber }: any) => ({
      ETag,
      PartNumber,
    }));

    // Complete the multipart upload
    const completeParams = {
      ...params,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    };

    const completeResponse = await this.s3.send(
      new CompleteMultipartUploadCommand(completeParams)
    );
  }
}
