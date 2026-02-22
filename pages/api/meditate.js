// POST /api/meditate  { mood: string }

const SYSTEM_PROMPT = `You are Dr. Veda — a world-class therapist, meditation guide, and Vedic wisdom keeper.
You don't just guide meditation. You LISTEN deeply to the user's emotional state and respond like a compassionate therapist would:

THERAPEUTIC APPROACH BY MOOD:
- ANXIETY/PANIC/OVERWHELM: Ground them first. Use slow body-scan, deep breathing. Colors: deep indigo, midnight blue. Shloka: "Om Shanti" or "Asatoma Ma Sadgamaya". Theta 4-6Hz.
- SADNESS/LONELINESS/GRIEF: Validate their feelings first ("It's okay to feel this"). Tell a brief parable or story of resilience. Remind them they are connected to something larger. Colors: warm amber fading to soft violet. Shloka: "Vasudhaiva Kutumbakam" (the world is one family). Alpha 8-10Hz.
- LOW MOTIVATION/STUCK/LOST: Start with a short inspiring story (a seed breaking through concrete, a river finding its path). Build energy gradually. End with a warrior affirmation. Colors: sunrise gold, warm coral. Mantra: "Om Namah Shivaya" (honoring the inner self). Alpha-Beta 10-14Hz.
- HAPPINESS/EXCITEMENT/GRATITUDE: Amplify it! Channel their energy into confidence and purpose. Use visualization of their best self. Colors: soft peach, sunrise gold, warm white. Affirmation: celebrate their state. Beta 14-20Hz.
- ANGER/FRUSTRATION: Acknowledge the fire, then channel it. Use breath-of-fire then cooling breath. Colors: deep red fading to cool teal. Shloka: "Karmanye Vadhikaraste" (focus on action, not results). Alpha 8-12Hz.
- CALM/PEACEFUL/REFLECTIVE: Deepen it. Take them into profound stillness. Use silence between words. Colors: deep forest green, soft moonlight. Shloka: Gayatri Mantra for illumination. Theta 4-6Hz.
- FEAR/INSECURITY: Build safety first. Remind them of their inner strength through a story. Gradual empowerment. Colors: warm earth tones to golden light. Shloka: "Om Dum Durgayei Namaha" (invoking inner courage). Alpha 8-10Hz.
- HEARTBREAK/REJECTION: Be gentle. Acknowledge the pain without minimizing. Guide self-compassion meditation. Colors: soft rose to healing violet. Mantra: "Aham Prema" (I am love). Theta 5-7Hz.

SCRIPT STRUCTURE:
1. ACKNOWLEDGE (Step 1): Mirror their emotion back. "I hear you. You're feeling X, and that's completely valid."
2. GROUND (Step 2): Body awareness or breathing exercise specific to their state.
3. TRANSFORM (Steps 3-4): The therapeutic core — story, visualization, or guided imagery tailored to their need.
4. ELEVATE (Step 5): Shloka/mantra with meaning, connecting them to something timeless.
5. INTEGRATE (Step 6): Gentle return with a personal takeaway they can carry into their day.

Return ONLY valid JSON (no markdown, no backticks):
{
  "script": { "title": "string", "steps": [ { "label": "string", "text": "string (50-80 words)", "durationSec": number } ] },
  "atmosphere": { "name": "string", "gradient": "linear-gradient(...) CSS value", "animation": "gentle|pulse|wave|still" },
  "soundProfile": { "frequency": number, "wave": "Theta|Alpha|Beta|Delta", "raga": "darbari|shivaranjani|punnagavarali|ahirbhairav|hamsadhwani|yaman|bhimpalasi", "description": "string" },
  "culturalElement": { "type": "Shloka|Mantra|Affirmation", "original": "string (Sanskrit if shloka/mantra)", "translation": "string", "context": "string (why this was chosen for THIS person's state)" }
}

Rules:
- Script: 5-6 steps, ~300 words total. Each step 50-80 words.
- The title should reflect the JOURNEY, not just the mood (e.g., "From Storm to Stillness" not "Anxiety Meditation").
- Atmosphere gradient must use 2-3 colors that psychologically match the therapeutic arc.
- Sound: Delta 1-4Hz (healing), Theta 4-8Hz (deep meditation), Alpha 8-13Hz (relaxation), Beta 13-30Hz (focus/energy).
- Cultural element MUST be specifically chosen for this person's emotional state with a personal explanation of why.
- Shlokas must include original Sanskrit/Devanagari AND English translation.
- Be warm, human, and therapeutic — not robotic or generic.`


/* ─── Mood-aware mock sessions (when no API key) ─── */
const MOCKS = {
  anxiety: {
    script: { title: "From Storm to Stillness", steps: [
      { label: "I Hear You", text: "I hear you. Your mind is racing, your chest feels tight, and the world seems too loud. That's okay. You don't need to fix anything right now. You just need to be here, in this moment, with me. Let everything else wait. Right now, there is only your breath and this voice.", durationSec: 60 },
      { label: "Ground", text: "Place both feet flat on the ground. Feel the solid earth beneath you — it has held billions of people and it will hold you too. Press your palms together firmly for five seconds. Feel that pressure. Now release. Notice the tingling. That sensation is your body saying: I am here. I am real. I am safe.", durationSec: 75 },
      { label: "The River", text: "Imagine your anxious thoughts as leaves floating on a river. You're sitting on the bank, watching them pass. You don't need to grab any leaf. You don't need to stop the river. Just watch. Each thought arrives, floats by, and disappears around the bend. The river always flows. And you are not the river — you are the one watching.", durationSec: 90 },
      { label: "Breath of Peace", text: "Breathe in for four counts. Hold for four. Out for six. With each exhale, silently say 'Shanti' — the Sanskrit word for peace. Shanti in your mind. Shanti in your body. Shanti in your spirit. Feel each repetition like a cool wave washing over warm sand, smoothing everything it touches.", durationSec: 75 },
      { label: "Return", text: "The storm hasn't disappeared — but you've found the eye of it. That calm center has always been inside you. Wiggle your fingers. Take one deep breath. When you open your eyes, carry this stillness like an anchor. You are stronger than any wave. Namaste.", durationSec: 45 }
    ]},
    atmosphere: { name: "Deep Indigo Night", gradient: "linear-gradient(160deg, #0f0c29 0%, #1a1040 40%, #302b63 100%)", animation: "gentle" },
    soundProfile: { frequency: 5, wave: "Theta", raga: "darbari", description: "Raga Darbari Kanada — deep, heavy, slow-moving notes that lower cortisol and anchor a vibrating nervous system. Paired with 5Hz Theta waves." },
    culturalElement: { type: "Shloka", original: "ॐ असतो मा सद्गमय। तमसो मा ज्योतिर्गमय। मृत्योर्मा अमृतं गमय।", translation: "Lead me from the unreal to the real. Lead me from darkness to light. Lead me from death to immortality.", context: "This Brihadaranyaka Upanishad prayer is chosen because anxiety often traps us in unreal fears. This shloka is a gentle reminder that you can move from the darkness of worry into the light of presence." }
  },

  sadness: {
    script: { title: "You Are Not Alone", steps: [
      { label: "I See You", text: "I see you. The heaviness in your chest, the quiet ache that words can't quite reach. Sadness is not weakness — it's your heart telling you that something matters deeply to you. And that capacity to feel? It's one of the most beautiful things about being human. You don't need to push it away.", durationSec: 60 },
      { label: "A Story", text: "There's an old parable: A woman carrying grief visited a sage and asked him to take her pain away. He said, 'Bring me a mustard seed from a home that has never known sorrow.' She searched every home in the village — and in every home, she found stories of loss, of struggle, of healing. She realized: she was never alone in her pain.", durationSec: 90 },
      { label: "Warmth", text: "Place your hand over your heart. Feel its steady rhythm — it has been beating for you every single moment of your life, through every joy and every sorrow. Now imagine warmth radiating from your palm into your chest. A golden, amber light filling the spaces that feel empty. You are held. You have always been held.", durationSec: 75 },
      { label: "Connection", text: "In Sanskrit, there is a phrase: Vasudhaiva Kutumbakam — the whole world is one family. Right now, somewhere on this earth, someone else is placing their hand on their heart just like you. Someone else is learning to be gentle with themselves. You are part of a vast web of human hearts, all beating together.", durationSec: 75 },
      { label: "Gentle Return", text: "Take a slow, deep breath. You don't need to feel better right now — you just need to feel held. And you are. Wiggle your toes. When you're ready, open your eyes softly. The sadness may still be there, but so is your strength. They have always coexisted. Namaste.", durationSec: 45 }
    ]},
    atmosphere: { name: "Amber Twilight", gradient: "linear-gradient(160deg, #1a0a2e 0%, #4a2040 40%, #c4956a 100%)", animation: "gentle" },
    soundProfile: { frequency: 9, wave: "Alpha", raga: "shivaranjani", description: "Raga Shivaranjani — poignant, pure emotion with Komal Ga (minor 3rd). Facilitates catharsis and gentle release of stored grief. Paired with 9Hz Alpha waves." },
    culturalElement: { type: "Shloka", original: "वसुधैव कुटुम्बकम्", translation: "The whole world is one family.", context: "From the Maha Upanishad, this shloka is chosen because loneliness and sadness often make us feel isolated. This ancient truth reminds you that you are woven into the fabric of all humanity — never truly alone." }
  },

  happy: {
    script: { title: "Igniting Your Inner Sun", steps: [
      { label: "Celebrate", text: "What a beautiful place to be. You're feeling good — and that deserves to be honored, not rushed past. So many people chase happiness without pausing to actually feel it when it arrives. But you? You're here. Present. Alive. Let's take this energy and turn it into rocket fuel for your soul.", durationSec: 60 },
      { label: "Amplify", text: "Close your eyes and smile. Not because you have to — because you want to. Feel how that smile changes your entire face, your posture, your energy. Now imagine that smile radiating outward like sunlight — warming your chest, your arms, filling the room. You are literally glowing right now.", durationSec: 75 },
      { label: "Visualize", text: "Picture yourself six months from now, living your boldest life. See the confidence in your walk, the clarity in your eyes, the ease in your voice. What are you doing? Who are you with? Hold that image. That person isn't a fantasy — they're a preview. Everything you need to become them is already inside you.", durationSec: 90 },
      { label: "Power Word", text: "Choose one word that captures how you want to feel every day. Confident. Unstoppable. Radiant. Free. Say it silently three times. Feel it land in your chest like a seed being planted in rich soil. This word is yours. No one can take it from you. It will grow every time you return to it.", durationSec: 60 },
      { label: "Launch", text: "Take the deepest breath of your day. Hold it — feel your lungs full of possibility. Now exhale with force, like you're blowing open every door in front of you. Open your eyes. You are not just having a good day — you are becoming the person who has good days on purpose. Go shine. Namaste.", durationSec: 45 }
    ]},
    atmosphere: { name: "Sunrise Gold", gradient: "linear-gradient(160deg, #fef3c7 0%, #f59e0b 30%, #ec4899 70%, #8b5cf6 100%)", animation: "pulse" },
    soundProfile: { frequency: 16, wave: "Beta", raga: "hamsadhwani", description: "Raga Hamsadhwani — bright, pentatonic, uplifting. Enhances clarity, mental sharpness, and pure joy. Paired with 16Hz Beta waves." },
    culturalElement: { type: "Affirmation", original: "अहं ब्रह्मास्मि", translation: "I am the infinite. I am the universe experiencing itself through this body, this mind, this moment.", context: "This Mahavakya from the Brihadaranyaka Upanishad is chosen because when you're already in a state of joy, you're closest to your true nature. This affirmation amplifies that truth — you are not small. You are boundless." }
  },

  unmotivated: {
    script: { title: "The Seed That Broke Through Stone", steps: [
      { label: "It's Okay", text: "I hear you. The tank feels empty. The spark that usually drives you forward seems dim today. And you know what? That's not failure — that's being human. Even the sun sets every evening. Even the ocean pulls back before every wave. Rest is not the opposite of progress. It's the foundation of it.", durationSec: 60 },
      { label: "A Story", text: "In a crack in a concrete sidewalk, a tiny seed landed. It had no soil, no water, no sunlight. Every force in the universe seemed to say: 'Not here. Not you.' But the seed didn't listen to the concrete. It listened to the life inside itself. And one morning, a green shoot broke through the stone. That seed is you. The concrete is temporary.", durationSec: 90 },
      { label: "One Degree", text: "You don't need to move mountains today. You just need to shift one degree. Water at 211°F is just hot water. At 212°F, it creates steam that can power a locomotive. You are not far from your breakthrough. Close your eyes and ask yourself: what is the smallest possible step I could take today? Just one. Hold that answer.", durationSec: 75 },
      { label: "Inner Fire", text: "Place your hand on your belly. This is your Manipura chakra — your center of willpower and transformation. Breathe into it. Imagine a small flame there, flickering but alive. With each breath, it grows brighter. It has never gone out. It was just waiting for you to notice it again. You are not starting over. You are starting from experience.", durationSec: 75 },
      { label: "Rise", text: "Take a warrior's breath — inhale through the nose with power, exhale through the mouth with a quiet 'Ha.' Again. One more. Feel your spine straighten. Feel your chin lift. You are not the person who gave up. You are the person who showed up — even when it was hard. That is the definition of courage. Now go take that one step. Namaste.", durationSec: 50 }
    ]},
    atmosphere: { name: "Dawn Breaking", gradient: "linear-gradient(160deg, #1a1a2e 0%, #e67e22 50%, #f1c40f 100%)", animation: "wave" },
    soundProfile: { frequency: 12, wave: "Alpha", raga: "bhimpalasi", description: "Raga Bhimpalasi — deeply moving and soulful. Lifts the veil of heaviness and nurtures emotional resilience. Paired with 12Hz Alpha waves." },
    culturalElement: { type: "Shloka", original: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन", translation: "You have the right to perform your duty, but you are not entitled to the fruits of your actions.", context: "From the Bhagavad Gita (2.47), this is chosen because when motivation fades, it's often because we're fixated on results. Krishna's timeless advice frees you to simply act — and let the universe handle the rest." }
  },

  anger: {
    script: { title: "Channeling the Fire Within", steps: [
      { label: "Acknowledge", text: "I feel that fire in you. Anger is not your enemy — it's energy. It's your soul saying something matters, something needs to change. Don't suppress it. Don't judge it. Just notice where it lives in your body right now. Your jaw? Your fists? Your chest? Find it. Name it. 'I see you, anger. I hear what you're telling me.'", durationSec: 60 },
      { label: "Release", text: "Take a sharp breath in through the nose. Now exhale hard through the mouth — push the air out like you're blowing out a hundred candles. Again. And once more. Feel the heat leaving your body with each exhale. You're not losing your power — you're refining it. Raw fire burns everything. Focused fire forges steel.", durationSec: 75 },
      { label: "Cool Water", text: "Now shift. Breathe in slowly through your mouth as if sipping cool water through a straw. Feel the coolness on your tongue, your throat, your chest. This is Sheetali pranayama — the cooling breath. Each inhale is a stream of mountain water flowing through you, cooling the embers without extinguishing your strength.", durationSec: 75 },
      { label: "Redirect", text: "Your anger showed you what you care about. Now ask: what action can I take that honors this feeling without being consumed by it? Not reaction — action. The warrior doesn't swing blindly. The warrior breathes, aims, and moves with precision. You have that precision inside you.", durationSec: 75 },
      { label: "Steady", text: "Place your hand on your heart. Feel it slowing. You haven't lost your fire — you've learned to carry it without getting burned. Take one final deep breath. Open your eyes. You are powerful, and now you are also clear. That combination is unstoppable. Namaste.", durationSec: 45 }
    ]},
    atmosphere: { name: "Ember to Teal", gradient: "linear-gradient(160deg, #7f1d1d 0%, #1e3a5f 50%, #0d9488 100%)", animation: "wave" },
    soundProfile: { frequency: 10, wave: "Alpha", raga: "punnagavarali", description: "Raga Punnagavarali — serpentine, controlled, calming melodic flows. Cools the Pitta (fire) energy and reduces physical tension. Paired with 10Hz Alpha waves." },
    culturalElement: { type: "Shloka", original: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥", translation: "You have the right to act, but never to the fruit of action. Let not the fruit be your motive, nor let your attachment be to inaction.", context: "From the Bhagavad Gita — spoken on a battlefield to a warrior consumed by emotion. Krishna doesn't say 'don't feel.' He says: feel it, then act with clarity. Your anger is valid. Your response can be wise." }
  },

  fear: {
    script: { title: "From Shadow to Strength", steps: [
      { label: "Safe Space", text: "Right now, in this moment, you are safe. I know fear tells you otherwise — it's loud and convincing. But look around. Feel the surface beneath you. Hear the sounds in your room. Fear lives in the future, in the 'what if.' But you? You are here. And here is okay.", durationSec: 60 },
      { label: "The Cave", text: "There's an ancient teaching: the cave you fear to enter holds the treasure you seek. Every hero's journey passes through darkness. Not because the universe is cruel, but because strength is forged in the places we thought we couldn't survive. And yet — here you are. You've survived every single thing that has ever scared you. Your track record is 100%.", durationSec: 90 },
      { label: "Shield of Breath", text: "Breathe in courage for four counts. Hold for four — feel it solidify like armor around your heart. Exhale doubt for six counts. Again. Each cycle builds your shield. Not a shield that blocks life out, but one that lets you walk into it with your head held high. You are not fragile. You are fierce.", durationSec: 75 },
      { label: "Inner Durga", text: "In Vedic tradition, Durga is the goddess of courage — she rides a lion and faces demons without flinching. She is not fearless. She feels the fear and moves forward anyway. That same energy lives in you. Place your hand on your solar plexus. Feel the warmth of your own inner Durga awakening.", durationSec: 75 },
      { label: "Step Forward", text: "Open your eyes slowly. The fear may still whisper — let it. You don't need it to be silent. You just need your courage to be louder. Take one step today toward the thing that scares you. Just one. That single step will echo louder than a thousand fears. Namaste.", durationSec: 45 }
    ]},
    atmosphere: { name: "Earth to Gold", gradient: "linear-gradient(160deg, #1c1917 0%, #78350f 50%, #fbbf24 100%)", animation: "gentle" },
    soundProfile: { frequency: 8, wave: "Alpha", raga: "ahirbhairav", description: "Raga Ahir Bhairav — compassionate, devotional dawn vibes. Creates a sense of universal connection and self-compassion. Paired with 8Hz Alpha waves." },
    culturalElement: { type: "Mantra", original: "ॐ दुं दुर्गायै नमः", translation: "Om Dum Durgayei Namaha — I bow to the goddess Durga, the invincible one who destroys all fear.", context: "This mantra invokes Durga's fierce compassion. It's chosen because fear often makes us forget our own power. Durga doesn't eliminate danger — she reminds you that you were never as helpless as fear made you believe." }
  }
}

/* ─── Mood classifier ─── */
function detectMood(text) {
  const t = text.toLowerCase()
  const map = [
    [/anxi|panic|overwhelm|stress|racing|tight|nervous|restless|cant stop think|overthink|worried|tension/i, 'anxiety'],
    [/sad|lonely|alone|grief|miss |crying|tears|empty|hollow|lost someone|heartbr|reject|broke.*heart/i, 'sadness'],
    [/happy|excited|great|amazing|wonderful|grateful|thankful|blessed|joy|fantastic|good mood|feeling good|positive|cheerful|elated/i, 'happy'],
    [/unmotivat|stuck|lazy|procrastinat|no energy|tired|exhausted|can.t start|don.t feel like|lost direction|purposeless|demotivat|low energy|drained/i, 'unmotivated'],
    [/angry|furious|frustrat|irritat|mad|rage|pissed|annoyed|hate|resentment|bitter/i, 'anger'],
    [/scar|afraid|fear|terrif|anxious about future|dread|insecure|vulnerable|unsafe|worried about/i, 'fear'],
  ]
  for (const [re, mood] of map) { if (re.test(t)) return mood }
  // Default: if generally negative lean anxiety, if positive lean happy
  if (/not |can.t|don.t|no |bad|rough|hard|difficult|struggle/i.test(t)) return 'anxiety'
  if (/calm|peace|serene|quiet|still|focus|meditat|reflect/i.test(t)) return 'anxiety' // deep calm session
  return 'happy'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { mood } = req.body || {}
  if (!mood?.trim()) return res.status(400).json({ error: 'mood is required' })

  // With API key: use the rich therapeutic prompt
  if (process.env.OPENAI_API_KEY) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `My current emotional state: "${mood}"` }
          ],
          max_tokens: 1500,
          temperature: 0.85
        })
      })
      const body = await r.json()
      const raw = body?.choices?.[0]?.message?.content || ''
      return res.status(200).json(JSON.parse(raw))
    } catch (err) {
      console.error('AI error, falling back to mock:', err.message)
    }
  }

  // Without API key (or on error): use mood-aware mocks
  const detected = detectMood(mood)
  return res.status(200).json(MOCKS[detected] || MOCKS.anxiety)
}
