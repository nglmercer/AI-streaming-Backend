// Simple test file for characters API
// Run with: node src/routes/characters.test.js

const BASE_URL = "http://localhost:12393";

async function testCharactersAPI() {
  console.log("🧪 Testing Characters API...\n");

  try {
    // Test 1: Get all characters
    console.log("1. Testing GET /characters");
    const response1 = await fetch(`${BASE_URL}/characters`);
    const data1 = await response1.json();
    console.log("✅ Status:", response1.status);
    console.log("📄 Response:", JSON.stringify(data1, null, 2));
    console.log("");

    // Test 2: Get specific character
    console.log("2. Testing GET /characters/mili");
    const response2 = await fetch(`${BASE_URL}/characters/mili`);
    const data2 = await response2.json();
    console.log("✅ Status:", response2.status);
    console.log("📄 Response:", JSON.stringify(data2, null, 2));
    console.log("");

    // Test 3: Get character prompt
    console.log("3. Testing GET /characters/mili/prompt");
    const response3 = await fetch(
      `${BASE_URL}/characters/mili/prompt?humanName=TestUser`
    );
    const data3 = await response3.json();
    console.log("✅ Status:", response3.status);
    console.log("📄 Response:", JSON.stringify(data3, null, 2));
    console.log("");

    // Test 4: Create new character
    console.log("4. Testing POST /characters (create test character)");
    const testCharacter = {
      name: "testbot",
      config: {
        name: "TestBot",
        personality: "Friendly test assistant",
        background: "Created for testing purposes",
        speaking_style: "Clear and concise",
        interests: ["testing", "debugging"],
      },
    };

    const response4 = await fetch(`${BASE_URL}/characters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testCharacter),
    });
    const data4 = await response4.json();
    console.log("✅ Status:", response4.status);
    console.log("📄 Response:", JSON.stringify(data4, null, 2));
    console.log("");

    // Test 5: Update character (if created successfully)
    if (response4.status === 201) {
      console.log("5. Testing PATCH /characters/testbot");
      const updateData = {
        personality: "Super friendly test assistant",
        new_field: "This is a test field",
      };

      const response5 = await fetch(`${BASE_URL}/characters/testbot`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      const data5 = await response5.json();
      console.log("✅ Status:", response5.status);
      console.log("📄 Response:", JSON.stringify(data5, null, 2));
      console.log("");

      // Test 6: Delete test character
      console.log("6. Testing DELETE /characters/testbot");
      const response6 = await fetch(`${BASE_URL}/characters/testbot`, {
        method: "DELETE",
      });
      const data6 = await response6.json();
      console.log("✅ Status:", response6.status);
      console.log("📄 Response:", JSON.stringify(data6, null, 2));
      console.log("");
    }

    // Test 7: Get multiple prompts
    console.log("7. Testing POST /characters/prompts/multiple");
    const multiplePromptsData = {
      characters: ["mili", "luna"],
      humanName: "TestUser",
    };

    const response7 = await fetch(`${BASE_URL}/characters/prompts/multiple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(multiplePromptsData),
    });
    const data7 = await response7.json();
    console.log("✅ Status:", response7.status);
    console.log("📄 Response:", JSON.stringify(data7, null, 2));

    console.log("\n🎉 All tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run tests if server is running
testCharactersAPI();
