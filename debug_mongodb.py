#!/usr/bin/env python3
"""
Debug script to analyze MongoDB database structure and test operations
"""
from pymongo import MongoClient
from bson import ObjectId
import sys

def debug_mongodb():
    # Connect to the Docker MongoDB
    client = MongoClient('mongodb://localhost:27017/ship-collection-v2')
    db = client['ship-collection-v2']
    collection = db['starshipv5']

    print("=== MongoDB Database Analysis ===")
    print(f"Database: {db.name}")
    print(f"Collection: {collection.name}")
    
    # Check total count
    total_count = collection.count_documents({})
    print(f"Total documents: {total_count}")

    # Check if the specific starship exists
    starship_id = "681578437a8c148f4679834a"
    print(f"\n=== Testing Starship ID: {starship_id} ===")

    # Try finding by string ID
    result_string = collection.find_one({"_id": starship_id})
    print(f"Found by string ID: {result_string is not None}")
    if result_string:
        print(f"  Ship name: {result_string.get('shipName', 'N/A')}")
        print(f"  ID type: {type(result_string['_id'])}")
        print(f"  Current imageUrl: {result_string.get('imageUrl', 'None')}")

    # Try finding by ObjectId
    try:
        result_objectid = collection.find_one({"_id": ObjectId(starship_id)})
        print(f"Found by ObjectId: {result_objectid is not None}")
        if result_objectid:
            print(f"  Ship name: {result_objectid.get('shipName', 'N/A')}")
    except Exception as e:
        print(f"ObjectId search error: {e}")

    # Get sample documents to understand ID structure
    print(f"\n=== Sample Document Structure ===")
    samples = list(collection.find({}).limit(5))
    for i, doc in enumerate(samples):
        print(f"Doc {i+1}: _id={doc['_id']} (type: {type(doc['_id'])})")
        if 'shipName' in doc:
            print(f"  shipName: {doc['shipName']}")
        if 'imageUrl' in doc:
            print(f"  imageUrl: {doc['imageUrl']}")

    # Test update operation
    if result_string:
        print(f"\n=== Testing Update Operations ===")
        test_image_url = f"/uploads/test-image-{starship_id}.png"
        
        # Test 1: Basic update with string ID
        try:
            update_result = collection.update_one(
                {"_id": starship_id},
                {"$set": {"imageUrl": test_image_url}}
            )
            print(f"String ID update: matched={update_result.matched_count}, modified={update_result.modified_count}")
        except Exception as e:
            print(f"String ID update error: {e}")

        # Test 2: Using findOneAndUpdate with string ID
        try:
            updated_doc = collection.find_one_and_update(
                {"_id": starship_id},
                {"$set": {"imageUrl": test_image_url + "-v2"}},
                return_document=True  # MongoDB driver parameter
            )
            print(f"findOneAndUpdate with string ID: {updated_doc is not None}")
            if updated_doc:
                print(f"  Updated imageUrl: {updated_doc.get('imageUrl', 'None')}")
        except Exception as e:
            print(f"findOneAndUpdate error: {e}")

        # Verify the current state
        final_check = collection.find_one({"_id": starship_id})
        if final_check:
            print(f"Final state - imageUrl: {final_check.get('imageUrl', 'None')}")

    client.close()
    print("\n=== Analysis Complete ===")

if __name__ == "__main__":
    debug_mongodb()