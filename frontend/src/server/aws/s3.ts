import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { env } from "~/env";

export class Client {

    private client: S3Client;

    constructor() {
        this.client = new S3Client({
            region: env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
        });
    }

    public async createFolderRecursively (Key: string){
        const parts = Key.split('/');
        let currentKey = '';
      
        for (const part of parts) {
          if (part) {
            currentKey += `${part}/`;
            try {
              const data = await this.listObjects(currentKey, 1);
              
              if (!data.Contents || data.Contents.length === 0) {
                await this.createFolder(currentKey);
              }
            } catch (error) {
              console.error(`Error creating folder ${currentKey}:`, error);
              throw error;
            }
          }
        }
      };

    public async createFolder(Key: string) {
        console.log(`[INFO][S3Client]: Creating folder ${Key}`);
        return this.client.send(new PutObjectCommand({ Bucket: env.AWS_BUCKET_NAME, Key, Body: '' }));
    }

    public async listObjects(Prefix: string, MaxKeys: number) {
        console.log(`[INFO][S3Client]: Listing objects with prefix ${Prefix}`);
        return this.client.send(new ListObjectsV2Command({ Bucket: env.AWS_BUCKET_NAME, Prefix, MaxKeys }));
    }

}

