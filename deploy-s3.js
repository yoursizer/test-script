#!/usr/bin/env node

/**
 * S3 Deployment Script for YourSizer Widget
 * This script uploads the built widget files to S3
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// AWS Configuration
const s3Client = new S3Client({
    region: 'eu-north-1',
});

const BUCKET_NAME = 'yoursizer-script-tag';

// Files to upload
const filesToUpload = [
    {
        localPath: './dist/style.css',
        s3Key: 'dist/style.css',
        contentType: 'text/css'
    },
    {
        localPath: './dist/yoursizer-widget.umd.js',
        s3Key: 'dist/yoursizer-widget.umd.js',
        contentType: 'application/javascript'
    }
];

async function uploadFile(localPath, s3Key, contentType) {
    try {
        console.log(`📤 Uploading ${localPath} to s3://${BUCKET_NAME}/${s3Key}`);
        
        const fileContent = fs.readFileSync(localPath);
        
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000' // 1 year cache
        });
        
        await s3Client.send(command);
        console.log(`✅ Successfully uploaded ${s3Key}`);
        
    } catch (error) {
        console.error(`❌ Error uploading ${s3Key}:`, error);
        throw error;
    }
}

async function deployToS3() {
    try {
        console.log('🚀 Starting S3 deployment...');
        
        // Check if dist directory exists
        if (!fs.existsSync('./dist')) {
            throw new Error('dist directory not found. Please run "npm run build" first.');
        }
        
        // Upload each file
        for (const file of filesToUpload) {
            if (!fs.existsSync(file.localPath)) {
                console.warn(`⚠️  File not found: ${file.localPath}`);
                continue;
            }
            
            await uploadFile(file.localPath, file.s3Key, file.contentType);
        }
        
        console.log('\n🎉 Deployment completed successfully!');
        console.log('📝 Files are now available at:');
        console.log('   - https://yoursizer-script-tag.s3.eu-north-1.amazonaws.com/dist/style.css');
        console.log('   - https://yoursizer-script-tag.s3.eu-north-1.amazonaws.com/dist/yoursizer-widget.umd.js');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

// Run deployment
if (require.main === module) {
    deployToS3();
}

module.exports = { deployToS3 };
