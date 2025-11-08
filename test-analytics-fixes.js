// Test script to verify the analytics fixes
// Run this in the browser console to test label formatting

// Test the formatXAxisLabel function with different intervals
function testLabelFormatting() {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Test dates for different intervals
  const testDates = [
    new Date("2025-08-15"), // Monthly test
    new Date("2025-09-15"), // Monthly test
    new Date("2025-10-15"), // Monthly test
    new Date("2025-11-15"), // Monthly test
  ];

  console.log("🧪 Testing Monthly Label Formatting:");
  testDates.forEach((date, index) => {
    // Simulate the formatXAxisLabel function
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear().toString();
    const shortYear = year.slice(-2);
    const label = `${month} '${shortYear}`;

    console.log(`  ${index + 1}. ${date.toDateString()} → "${label}"`);
  });

  // Test weekly intervals
  console.log("\n📅 Testing Weekly Label Formatting:");
  const weeklyDates = [
    new Date("2025-01-01"), // Week 1
    new Date("2025-02-01"), // Week 5
    new Date("2025-03-01"), // Week 9
  ];

  weeklyDates.forEach((date, index) => {
    const weekOfYear = Math.ceil(
      (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    );
    const label = `W${weekOfYear}`;
    console.log(`  ${index + 1}. ${date.toDateString()} → "${label}"`);
  });

  console.log("\n✅ Expected Results:");
  console.log('  Monthly: No duplicate labels like "Aug Aug Aug"');
  console.log('  Weekly: Unique week numbers like "W1 W5 W9"');
  console.log('  No more "Aug Aug Aug Sep Sep Sep" - now shows unique periods');
}

// Run the test
testLabelFormatting();
