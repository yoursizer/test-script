#!/usr/bin/env node

/**
 * S3 CORS Policy Fix Script
 * This script updates the S3 bucket CORS policy to allow cross-origin requests
 * for the YourSizer widget files.
 */

const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');

// AWS Configuration
const s3Client = new S3Client({
    region: 'eu-north-1', // Your S3 bucket region
    // Credentials will be loaded from environment variables or AWS config
});

const BUCKET_NAME = 'yoursizer-script-tag';

// CORS Configuration
const corsConfiguration = {
    CORSRules: [
        {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'], // Allow all origins for widget usage
            ExposeHeaders: ['ETag', 'x-amz-meta-custom-header'],
            MaxAgeSeconds: 3600
        }
    ]
};

async function fixCorsPolicy() {
    try {
        console.log('🔧 Fixing S3 CORS policy for bucket:', BUCKET_NAME);
        
        // First, check current CORS configuration
        try {
            const getCorsCommand = new GetBucketCorsCommand({ Bucket: BUCKET_NAME });
            const currentCors = await s3Client.send(getCorsCommand);
            console.log('📋 Current CORS configuration:', JSON.stringify(currentCors, null, 2));
        } catch (error) {
            if (error.name === 'NoSuchCORSConfiguration') {
                console.log('ℹ️  No existing CORS configuration found');
            } else {
                console.warn('⚠️  Could not retrieve current CORS configuration:', error.message);
            }
        }
        
        // Apply new CORS configuration
        const putCorsCommand = new PutBucketCorsCommand({
            Bucket: BUCKET_NAME,
            CORSConfiguration: corsConfiguration
        });
        
        await s3Client.send(putCorsCommand);
        console.log('✅ CORS policy updated successfully!');
        
        // Verify the update
        const getCorsCommand = new GetBucketCorsCommand({ Bucket: BUCKET_NAME });
        const updatedCors = await s3Client.send(getCorsCommand);
        console.log('🔍 Updated CORS configuration:', JSON.stringify(updatedCors, null, 2));
        
        console.log('\n🎉 CORS policy fix completed!');
        console.log('📝 The following resources should now be accessible:');
        console.log('   - https://yoursizer-script-tag.s3.eu-north-1.amazonaws.com/dist/style.css');
        console.log('   - https://yoursizer-script-tag.s3.eu-north-1.amazonaws.com/dist/yoursizer-widget.umd.js');
        
    } catch (error) {
        console.error('❌ Error fixing CORS policy:', error);
        
        if (error.name === 'NoSuchBucket') {
            console.error('💡 The bucket does not exist. Please check the bucket name.');
        } else if (error.name === 'AccessDenied') {
            console.error('💡 Access denied. Please check your AWS credentials and permissions.');
        } else if (error.name === 'InvalidBucketName') {
            console.error('💡 Invalid bucket name. Please check the bucket name format.');
        }
        
        process.exit(1);
    }
}

// Alternative CORS configuration for more restrictive access
const restrictiveCorsConfiguration = {
    CORSRules: [
        {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: [
                'https://*.ticimaxdemo.com',
                'https://*.ticimax.com',
                'https://*.ticimax.net',
                'https://localhost:*',
                'https://127.0.0.1:*'
            ],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600
        }
    ]
};

async function applyRestrictiveCors() {
    try {
        console.log('🔒 Applying restrictive CORS policy...');
        
        const putCorsCommand = new PutBucketCorsCommand({
            Bucket: BUCKET_NAME,
            CORSConfiguration: restrictiveCorsConfiguration
        });
        
        await s3Client.send(putCorsCommand);
        console.log('✅ Restrictive CORS policy applied successfully!');
        
    } catch (error) {
        console.error('❌ Error applying restrictive CORS policy:', error);
        process.exit(1);
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--restrictive')) {
        applyRestrictiveCors();
    } else {
        fixCorsPolicy();
    }
}

module.exports = {
    fixCorsPolicy,
    applyRestrictiveCors,
    corsConfiguration,
    restrictiveCorsConfiguration
};
