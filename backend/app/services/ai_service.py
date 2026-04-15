"""AI service for food recognition and analysis."""
import base64
import json
from decimal import Decimal
from typing import Any
import httpx
import boto3
from botocore.exceptions import ClientError

from app.core.config import settings
from app.schemas.food_log import AIFoodAnalysis


class AIService:
    """AI service for analyzing food photos using AWS Bedrock Claude."""

    def __init__(self):
        """Initialize AI service with AWS Bedrock client."""
        try:
            self.bedrock_client = boto3.client(
                service_name='bedrock-runtime',
                region_name=settings.AWS_BEDROCK_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
        except Exception as e:
            print(f"Warning: Failed to initialize Bedrock client: {e}")
            self.bedrock_client = None

    async def analyze_food_photo(self, image_data: bytes) -> AIFoodAnalysis:
        """
        Analyze food photo using AWS Bedrock Claude Sonnet 4.6 with vision.

        Args:
            image_data: Image bytes

        Returns:
            AIFoodAnalysis with detected food and nutrition info

        Raises:
            ValueError: If analysis fails
        """
        if not self.bedrock_client:
            raise ValueError("AWS Bedrock client not configured. Check AWS credentials and region.")

        # Encode image to base64
        base64_image = base64.b64encode(image_data).decode("utf-8")

        # Determine image media type (default to jpeg)
        media_type = "image/jpeg"
        if image_data[:4] == b'\x89PNG':
            media_type = "image/png"
        elif image_data[:3] == b'GIF':
            media_type = "image/gif"
        elif image_data[:4] == b'WEBP' or image_data[8:12] == b'WEBP':
            media_type = "image/webp"

        # Create prompt for food analysis
        prompt = """Analyze this food image and provide nutritional information.

Return ONLY a valid JSON object with the following structure (no markdown, no code blocks, just JSON):
{
  "food_name": "main dish name (be specific, e.g., 'Grilled Chicken Breast' not just 'Chicken')",
  "confidence": 0.85,
  "calories": 250,
  "protein_g": 30.5,
  "carbs_g": 12.0,
  "fat_g": 8.5,
  "fiber_g": 2.0,
  "serving_size": 150,
  "serving_unit": "g",
  "detected_items": [
    {
      "name": "individual food item",
      "portion": "estimated portion (e.g., '1 cup', '4 oz')",
      "calories": 250
    }
  ]
}

Be as accurate as possible with portion sizes. Consider plate size, perspective, and typical serving sizes.
If multiple foods are visible, list them in detected_items and sum the totals.
Return ONLY the JSON object, nothing else."""

        # Prepare request body for Claude on Bedrock
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": base64_image
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        }

        try:
            # Invoke Claude Sonnet 4.6 on Bedrock
            response = self.bedrock_client.invoke_model(
                modelId='anthropic.claude-sonnet-4-6',
                body=json.dumps(request_body)
            )

            # Parse response
            response_body = json.loads(response.get('body').read())

            if not response_body.get('content'):
                raise ValueError("Empty response from Claude")

            # Extract text content from response
            content_text = ""
            for content_block in response_body['content']:
                if content_block.get('type') == 'text':
                    content_text += content_block.get('text', '')

            if not content_text:
                raise ValueError("No text content in Claude response")

            # Parse JSON from response (handle potential markdown code blocks)
            content_text = content_text.strip()
            if content_text.startswith('```json'):
                content_text = content_text[7:]
            if content_text.startswith('```'):
                content_text = content_text[3:]
            if content_text.endswith('```'):
                content_text = content_text[:-3]
            content_text = content_text.strip()

            result = json.loads(content_text)

            # Convert to AIFoodAnalysis schema
            return AIFoodAnalysis(
                food_name=result.get("food_name", "Unknown Food"),
                confidence=float(result.get("confidence", 0.5)),
                calories=int(result.get("calories", 0)),
                protein_g=Decimal(str(result.get("protein_g", 0))),
                carbs_g=Decimal(str(result.get("carbs_g", 0))),
                fat_g=Decimal(str(result.get("fat_g", 0))),
                fiber_g=Decimal(str(result.get("fiber_g", 0))),
                serving_size=Decimal(str(result.get("serving_size", 1))),
                serving_unit=result.get("serving_unit", "serving"),
                detected_items=result.get("detected_items", []),
            )

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            raise ValueError(f"AWS Bedrock error ({error_code}): {error_message}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse Claude response as JSON: {str(e)}")
        except Exception as e:
            raise ValueError(f"Failed to analyze food photo: {str(e)}")

    async def search_food_database(self, query: str, limit: int = 10) -> list[dict[str, Any]]:
        """
        Search food database (placeholder for FatSecret API integration).

        Args:
            query: Search query
            limit: Maximum results to return

        Returns:
            List of food items with nutrition info
        """
        # TODO: Integrate with FatSecret API or USDA database
        # For now, return mock data
        return [
            {
                "food_name": f"{query} (Generic)",
                "brand_name": None,
                "serving_size": 100,
                "serving_unit": "g",
                "calories": 200,
                "protein_g": 10.0,
                "carbs_g": 20.0,
                "fat_g": 8.0,
                "fiber_g": 2.0,
            }
        ]

    async def scan_barcode(self, barcode: str) -> dict[str, Any] | None:
        """
        Look up food by barcode using OpenFoodFacts API.

        Args:
            barcode: Product barcode

        Returns:
            Food nutrition info or None if not found
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
                )

                if response.status_code != 200:
                    return None

                data = response.json()

                if data.get("status") != 1:
                    return None

                product = data.get("product", {})
                nutriments = product.get("nutriments", {})

                return {
                    "food_name": product.get("product_name", "Unknown Product"),
                    "brand_name": product.get("brands", ""),
                    "serving_size": nutriments.get("serving_size", "100g"),
                    "calories": int(nutriments.get("energy-kcal_100g", 0)),
                    "protein_g": float(nutriments.get("proteins_100g", 0)),
                    "carbs_g": float(nutriments.get("carbohydrates_100g", 0)),
                    "fat_g": float(nutriments.get("fat_100g", 0)),
                    "fiber_g": float(nutriments.get("fiber_100g", 0)),
                    "barcode": barcode,
                }

        except Exception:
            return None
