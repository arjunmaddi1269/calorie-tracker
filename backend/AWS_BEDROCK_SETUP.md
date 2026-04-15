# AWS Bedrock Setup for Claude Sonnet 4.6

The application now uses **AWS Bedrock with Claude Sonnet 4.6** instead of OpenAI for AI-powered food photo analysis.

## Why AWS Bedrock?

- **Superior vision analysis**: Claude Sonnet 4.6 excels at image understanding
- **Better cost efficiency**: More competitive pricing than OpenAI GPT-4 Vision
- **AWS integration**: Seamless integration with your existing AWS infrastructure
- **Data residency**: Keep data within AWS ecosystem for compliance
- **No separate API keys**: Uses your AWS credentials

## Prerequisites

1. **AWS Account** with access to AWS Bedrock
2. **Model Access** to Claude Sonnet 4.6 in AWS Bedrock
3. **IAM Permissions** for `bedrock:InvokeModel`

## Step 1: Enable Model Access in AWS Bedrock

1. Sign in to the AWS Console
2. Navigate to **Amazon Bedrock**
3. Go to **Model access** in the left sidebar
4. Click **Modify model access**
5. Find **Anthropic** section
6. Enable **Claude Sonnet 4.6** (`anthropic.claude-sonnet-4-6`)
7. Click **Save changes**

> **Note**: Model access approval is usually instant for standard AWS accounts. Some regions may have waitlists.

## Step 2: Create IAM User/Role for Bedrock Access

### Option A: Using IAM User (for development)

1. Go to **IAM** → **Users** → **Create user**
2. Name: `calorie-tracker-bedrock-user`
3. Attach policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvokeModel",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-6"
    }
  ]
}
```

4. Create access key → Save **Access Key ID** and **Secret Access Key**

### Option B: Using IAM Role (for production/EC2)

If running on EC2/ECS/Lambda, attach this policy to your instance role instead.

## Step 3: Configure Environment Variables

Update your `backend/.env` file:

```env
# AWS Credentials (use your actual credentials with Bedrock access)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# AWS Bedrock Configuration
AWS_BEDROCK_REGION=us-east-1

# S3 Configuration (can use same credentials)
AWS_S3_BUCKET=calorie-tracker
AWS_S3_REGION=us-east-1
AWS_S3_ENDPOINT_URL=  # Leave empty for AWS S3, set for MinIO
```

### Important Notes:

- **Replace** `minioadmin` credentials with your actual AWS credentials
- **Region**: Claude Sonnet 4.6 is available in:
  - `us-east-1` (N. Virginia) - Recommended
  - `us-east-2` (Ohio)
  - `us-west-2` (Oregon)
  - `eu-west-2` (London)
  - See [full list](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-4-6.html#regional-availability)
- **S3**: You can use AWS S3 or keep MinIO for local development

## Step 4: Install Dependencies (if needed)

```bash
cd backend
source venv/bin/activate
pip install boto3  # Should already be in requirements.txt
```

## Step 5: Test the Setup

### Test 1: Check Bedrock Connection

```python
import boto3
import json

bedrock = boto3.client(
    service_name='bedrock-runtime',
    region_name='us-east-1'
)

# Simple text test
body = json.dumps({
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello!"}]
})

response = bedrock.invoke_model(
    modelId='anthropic.claude-sonnet-4-6',
    body=body
)

print(json.loads(response['body'].read()))
```

### Test 2: API Endpoint

Start the backend server and test the analyze photo endpoint:

```bash
curl -X POST http://localhost:8000/api/v1/food/analyze-photo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/food-image.jpg"
```

## Troubleshooting

### Error: "Could not connect to the endpoint URL"

**Cause**: Wrong region or Bedrock not available in that region

**Fix**:
- Verify region supports Claude Sonnet 4.6
- Check `AWS_BEDROCK_REGION` in .env
- Try `us-east-1` which has full availability

### Error: "AccessDeniedException"

**Cause**: IAM user/role doesn't have `bedrock:InvokeModel` permission

**Fix**:
- Check IAM policy includes Bedrock permissions
- Verify model access is enabled in Bedrock console
- Confirm you're using correct AWS credentials

### Error: "ValidationException: The provided model identifier is invalid"

**Cause**: Model ID wrong or model not available in region

**Fix**:
- Verify model ID is `anthropic.claude-sonnet-4-6`
- Check model is enabled in Bedrock console
- Try different region if model not available

### Error: "ThrottlingException"

**Cause**: Exceeded request rate limits

**Fix**:
- Check Bedrock quotas in Service Quotas console
- Request quota increase if needed
- Implement rate limiting in application

## Cost Estimation

Claude Sonnet 4.6 pricing (as of 2026):
- **Input**: ~$3 per million tokens
- **Output**: ~$15 per million tokens

For image analysis:
- Average request: ~1,500 input tokens + 500 output tokens
- Cost per analysis: ~$0.0045 - $0.0075
- 1,000 analyses: ~$5-7

Compare to OpenAI GPT-4 Vision: ~$0.01-0.015 per analysis

## Regional Availability

Claude Sonnet 4.6 is available in these regions:

| Region | Code | Availability |
|--------|------|--------------|
| US East (N. Virginia) | us-east-1 | ✅ Full |
| US East (Ohio) | us-east-2 | ✅ Full |
| US West (Oregon) | us-west-2 | ✅ Full |
| EU (London) | eu-west-2 | ✅ Full |
| EU (Frankfurt) | eu-central-1 | ✅ Cross-region |
| Asia Pacific | ap-* | ✅ Global inference |

**Recommendation**: Use `us-east-1` for best availability and lowest latency.

## Security Best Practices

1. **Never commit AWS credentials** to version control
2. **Use IAM roles** instead of access keys when possible (EC2/ECS/Lambda)
3. **Rotate access keys** regularly (every 90 days)
4. **Use least privilege**: Only grant `bedrock:InvokeModel` for specific models
5. **Enable CloudTrail** to audit Bedrock API calls
6. **Set up billing alerts** to monitor usage

## Migration from OpenAI (Legacy)

The old OpenAI integration is removed. If you need to rollback:

1. Install: `pip install openai`
2. Revert `app/services/ai_service.py` from git history
3. Set `OPENAI_API_KEY` in .env

However, we recommend using Bedrock for better performance and cost efficiency.

## Support

For AWS Bedrock issues:
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude Model Card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-4-6.html)
- [AWS Support](https://console.aws.amazon.com/support/)

For application issues:
- Check backend logs
- Verify all environment variables are set
- Test with simple curl command first
