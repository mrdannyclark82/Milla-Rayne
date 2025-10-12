
import type { Request, Response } from "express";
import { generateElevenLabsSpeech } from "./elevenLabsService";

const meditationScript = `
(Sound of gentle, calming music starts and fades into the background)

Narrator: Welcome. Find a comfortable position, either sitting or lying down. Gently close your eyes and begin to bring your awareness to your breath.

(Pause for 10 seconds)

Narrator: Notice the sensation of the breath as it enters your body, and as it leaves. Feel the rise and fall of your chest or abdomen with each inhalation and exhalation.

(Pause for 15 seconds)

Narrator: There is no need to change your breathing in any way. Simply observe it, allowing it to be your anchor to the present moment.

(Pause for 15 seconds)

Narrator: Now, bring your attention to your feet. Notice any sensations you feel... warmth, coolness, tingling, or pressure. Let your feet become heavy and relaxed.

(Pause for 10 seconds)

Narrator: Allow this feeling of relaxation to slowly travel up into your ankles, your calves, and your knees. Feel all the muscles in your legs letting go of any tension.

(Pause for 15 seconds)

Narrator: Bring your awareness now to your hips, your lower back, and your abdomen. Feel this area soften and release. Let go of any holding or tightness.

(Pause for 15 seconds)

Narrator: Let the wave of relaxation continue to move up your body, into your chest and your upper back. Feel your shoulders dropping, releasing any burdens you may be carrying.

(Pause for 10 seconds)

Narrator: Allow your arms, hands, and fingers to become heavy and limp. Completely relaxed.

(Pause for 10 seconds)

Narrator: Now, bring your attention to your neck, your jaw, and your facial muscles. Let your jaw hang loosely. Soften the area around your eyes and your forehead. Release all tension.

(Pause for 15 seconds)

Narrator: Your entire body is now in a state of deep relaxation. You are calm, safe, and at peace.

(Pause for 20 seconds)

Narrator: As you rest in this stillness, know that you can return to this place of inner quiet anytime you need. It is always available to you.

(Pause for 20 seconds)

Narrator: When you are ready, slowly begin to bring your awareness back to the room. Wiggle your fingers and toes. Gently move your head from side to side.

(Pause for 10 seconds)

Narrator: Take one more deep breath in, and as you exhale, slowly and gently open your eyes.

(Sound of gentle, calming music fades back in and then slowly fades out)
`;

export async function handleGuidedMeditation(req: Request, res: Response) {
  try {
    const audioUrl = await generateElevenLabsSpeech(meditationScript);

    if (audioUrl) {
      res.json({ success: true, audioUrl });
    } else {
      res.status(500).json({ success: false, message: "Failed to generate meditation audio." });
    }
  } catch (error) {
    console.error("Error handling guided meditation request:", error);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
}
