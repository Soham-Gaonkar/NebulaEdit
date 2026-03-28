import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    print("Health check passed")

def test_supir_upscale():
    input_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    payload = {
        "workflow": "SUPIR_UPSCALE",
        "inputs": {
            "image": input_image
            # Other fields are optional now
        }
    }
    response = requests.post(f"{BASE_URL}/api/workflow", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["image"] == input_image
    print("SUPIR Upscale test passed")

def test_single_edit():
    input_image = "data:image/png;base64,test_image_data"
    payload = {
        "workflow": "SINGLE_EDIT",
        "inputs": {
            "image": input_image,
            "prompt": "make it blue" # Optional but testing with it
        }
    }
    response = requests.post(f"{BASE_URL}/api/workflow", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["image"] == input_image
    print("Single Edit test passed")

if __name__ == "__main__":
    try:
        test_health()
        test_supir_upscale()
        test_single_edit()
        print("All tests passed!")
    except Exception as e:
        print(f"Test failed: {e}")
