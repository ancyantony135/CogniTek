import google.generativeai as genai

# Load your API Key
with open("api_key.txt", "r") as f:
    key = f.read().strip()

genai.configure(api_key=key)

print("------------------------------------------------")
print("🔍 CONTACTING GOOGLE AI...")
print("------------------------------------------------")

try:
    for m in genai.list_models():
        # Only show models that can generate text (Chatbots)
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ AVAILABLE: {m.name}")
except Exception as e:
    print(f"❌ ERROR: {e}")

print("------------------------------------------------")