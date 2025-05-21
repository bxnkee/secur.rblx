// Simple serverless API for Secur.RBLX behavior analysis
// This file should be placed in the root of your Vercel project

export default function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get behavior data from request body
    const behaviorData = req.body;
    
    // Extract behavior metrics
    const { 
      time, 
      input, 
      captcha,
      keystrokes, 
      clicks,
      typing_speed, 
      method
    } = behaviorData;

    // Initialize risk assessment
    let riskScore = 0;
    let riskFactors = [];
    
    // Check 1: Time taken to solve (too fast = suspicious)
    if (time < 1.5) {
      riskScore += 30;
      riskFactors.push("unusually_fast_solution");
    }
    
    // Check 2: Time taken to solve (too slow may indicate automation tools)
    if (time > 60) {
      riskScore += 15;
      riskFactors.push("unusually_slow_solution");
    }
    
    // Check 3: Keystroke count relative to input length
    // Human typing usually results in more keystrokes than final input (corrections)
    const expectedMinKeystrokes = input.length * 0.9;
    if (keystrokes < expectedMinKeystrokes && input.length > 3) {
      riskScore += 20;
      riskFactors.push("too_few_keystrokes");
    }
    
    // Check 4: Click count (should have at least 1 click to focus input)
    if (clicks < 1) {
      riskScore += 15;
      riskFactors.push("no_input_interaction");
    }
    
    // Check 5: Typing speed analysis (superhuman speed is suspicious)
    if (typing_speed > 15) { // characters per second
      riskScore += 25;
      riskFactors.push("superhuman_typing_speed");
    }
    
    // Check 6: Perfect input matching (no corrections can be suspicious)
    if (keystrokes === input.length && input.length > 3) {
      riskScore += 10;
      riskFactors.push("no_corrections_made");
    }
    
    // Determine if the behavior seems human-like
    const isHumanLike = riskScore < 40; // Threshold for human vs bot
    
    // Log for analysis (if needed)
    console.log({
      input_length: input?.length || 0,
      time,
      keystrokes,
      clicks,
      typing_speed,
      risk_score: riskScore,
      risk_factors: riskFactors,
      valid: isHumanLike
    });
    
    // Set CORS headers to allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Return validation result
    return res.status(200).json({ 
      valid: isHumanLike,
      risk_score: riskScore,
      risk_factors: riskFactors
    });
  } catch (error) {
    console.error("Error in AI behavior analysis:", error);
    // Default to valid if there's an error to prevent locking out legitimate users
    return res.status(200).json({ valid: true, error: "Analysis failed" });
  }
}