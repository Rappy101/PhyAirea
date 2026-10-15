"use strict";

/** Set to false before shipping. When false, all admin UI and skip/unlock cheats are hidden. */
const ADMIN = true;

const ADMIN_KEY = "physics-airea-admin";
const APP_NAME = "Physics Airea";
const MSG_TUTORIAL_FIRST = "Finish the free-body diagram tutorial first.";

function adminEnabled() {
  if (!ADMIN) return false;
  try { return localStorage.getItem(ADMIN_KEY) === "1"; } catch (err) { return false; }
}

function setAdminEnabled(on) {
  if (!ADMIN) return;
  try { localStorage.setItem(ADMIN_KEY, on ? "1" : "0"); } catch (err) { /* private mode */ }
  document.body.classList.toggle("is-admin", !!on);
}

function adminUnlockAll() {
  store.data.tutorial = 1;
  [1, 2, 3].forEach((id) => { store.data.flag["lawintro." + id] = 1; });
  for (let law = 1; law <= 3; law += 1) {
    ["easy", "moderate", "hard"].forEach((diff) => {
      const set = getLawProblems(law, diff) || [];
      set.forEach((_, i) => markProblemSolved(problemKey(law, diff, i + 1)));
    });
  }
  CHALLENGE_POOL.forEach((item) => store.setFlag("ch." + item.key));
  store.data.challenge = 1;
  store.save();
}

const WEIGHT = {
  1: [["learn", 15], ["explore", 25], ["quiz", 40], ["challenge", 20]],
  2: [["learn", 10], ["explore", 20], ["practice", 25], ["challenge", 15], ["checkpoint", 30]],
  3: [["learn", 10], ["explore", 20], ["match", 30], ["error", 15], ["quiz", 25]],
  4: [["learn", 20], ["build", 50], ["practice", 30]],
  5: [["read", 10], ["identify", 15], ["construct", 25], ["analyze", 15], ["apply", 20], ["check", 15]]
};

const FLOW = {
  1: [
    ["learn", "1 · Learn", "learn"],
    ["explore", "2 · Explore", "explore"],
    ["check", "3 · Check", "quiz"],
    ["challenge", "4 · Challenge", "challenge"]
  ],
  2: [
    ["learn", "1 · Learn", "learn"],
    ["explore", "2 · Explore", "explore"],
    ["practice", "3 · Practice", "practice"],
    ["challenge", "4 · Challenge", "challenge"],
    ["checkpoint", "5 · Checkpoint", "checkpoint"]
  ],
  3: [
    ["learn", "1 · Learn", "learn"],
    ["explore", "2 · Explore", "explore"],
    ["match", "3 · Pair-match", "match"],
    ["error", "4 · Error check", "error"],
    ["check", "5 · Check", "quiz"]
  ],
  4: [
    ["learn", "1 · Learn", "learn"],
    ["build", "2 · FBD Builder", "build"],
    ["practice", "3 · Practice", "practice"]
  ],
  5: [
    ["read", "1 · Read", "read"],
    ["identify", "2 · Identify", "identify"],
    ["construct", "3 · Construct", "construct"],
    ["analyze", "4 · Analyze", "analyze"],
    ["apply", "5 · Apply", "apply"],
    ["check", "6 · Final check", "check"]
  ]
};

const SESSIONS = [
  { id: 1, title: "Newton's First Law", short: "Newton's First Law", blurb: "Motion stays the same until a net force changes it." },
  { id: 2, title: "Newton's Second Law", short: "Newton's Second Law", blurb: "Net force, mass, and acceleration stay tied together." },
  { id: 3, title: "Newton's Third Law", short: "Newton's Third Law", blurb: "Forces arrive in equal pairs on different objects." },
  { id: 4, title: "Free-Body Diagrams", short: "Free-Body Diagrams", blurb: "Isolate one object and draw every force on it." },
  { id: 5, title: "Applying FBDs to Newton's Laws", short: "FBD Application", blurb: "Diagram the problem, then find force and acceleration." }
];

const TOPICS = [
  { id: "tutorial", title: "Free-body diagram tutorial", blurb: "Learn the steps on one example: isolate the object, add forces, and check your diagram.", tone: 4, href: "#/tutorial" },
  { id: "law1", title: "Newton’s First Law", blurb: "When forces balance, motion stays the same. Two forces at first, then harder cases.", tone: 1, href: "#/law/1" },
  { id: "law2", title: "Newton’s Second Law", blurb: "When the net force is not zero, use F = ma. Draw first, then calculate.", tone: 2, href: "#/law/2" },
  { id: "law3", title: "Newton’s Third Law", blurb: "Forces come in pairs on different objects. Stay focused on one object at a time.", tone: 3, href: "#/law/3" },
  { id: "challenge", title: "Challenge", blurb: "Five mixed problems with a time limit. You decide which law fits each one.", tone: 5, href: "#/challenge" }
];

const ORCHARD = { id: "finale", title: "Newton’s orchard", blurb: "Unlocks when you finish the challenge—a short closing scene.", tone: "final", href: "#/final" };
const COURSE_PATH = TOPICS.concat([ORCHARD]);

const NEWTON_QUOTES = [
  { text: "If I have seen further, it is by standing on the shoulders of giants.", cite: "Letter to Robert Hooke, 1675" },
  { text: "A body continues in its state of rest, or of uniform motion in a right line, unless it is compelled to change that state by forces impressed upon it.", cite: "Principia, Law I" },
  { text: "The alteration of motion is ever proportional to the motive force impressed, and is made in the direction of the right line in which that force is impressed.", cite: "Principia, Law II" },
  { text: "To every action there is always opposed an equal reaction.", cite: "Principia, Law III" },
  { text: "Nature is pleased with simplicity, and affects not the pomp of superfluous causes.", cite: "Principia, Rule I" },
  { text: "I was like a boy playing on the sea-shore, and diverting myself in now and then finding a smoother pebble or a prettier shell than ordinary, whilst the great ocean of truth lay all undiscovered before me.", cite: "Recalled by Sir David Brewster" }
];

const LAW_INTRO = {
  1: {
    kicker: "Newton’s first law",
    title: "Law of inertia",
    lede: "If the net force is zero, motion does not change.",
    points: [
      "An object at rest stays at rest.",
      "An object in motion keeps the same speed in a straight line.",
      "That changes only when an unbalanced (net) force acts on it.",
      "On an FBD, opposing arrows that are equal mean the net force is zero."
    ]
  },
  2: {
    kicker: "Newton’s second law",
    title: "Law of acceleration",
    lede: "Net force equals mass times acceleration: F = ma.",
    points: [
      "A larger net force gives a larger acceleration.",
      "A larger mass gives a smaller acceleration for the same force.",
      "Acceleration points the same way as the net force.",
      "Draw the FBD first, then use a = Fnet / m."
    ]
  },
  3: {
    kicker: "Newton’s third law",
    title: "Law of interaction",
    lede: "Forces come in equal and opposite pairs on two different objects.",
    points: [
      "If A pushes B, B pushes A with the same size, opposite direction.",
      "The pair never acts on the same object, so the two forces do not cancel on one FBD.",
      "Draw only the forces that act on the object in the problem.",
      "Do not draw the force this object exerts on something else."
    ]
  }
};

const LEVEL_LABEL = { easy: "Easy · two forces", moderate: "Moderate · three forces", hard: "Difficult · many forces" };
const DIFF_HINT = {
  easy: "Five problems with two forces on each diagram.",
  moderate: "Five problems with three forces on each diagram.",
  hard: "Five problems with several forces on one object."
};
const TIME_LIMIT = { easy: 90, moderate: 120, hard: 180, challenge: 150 };

const TUTORIAL_STEPS = [
  { title: "Isolate the object", body: "Choose one object and separate it from the ropes, surfaces, and other things around it." },
  { title: "Represent the object simply", body: "Draw that object as a dot, square, or box." },
  { title: "Identify all forces", body: "List every force on that object: weight down, normal force out of the surface, friction, tension, an applied push, or drag." },
  { title: "Draw force vectors as arrows", body: "Start each arrow at the center and point it the way the force acts. A longer arrow means a stronger force." },
  { title: "Label the forces", body: "Use Fg or W, Fn or N, Ff, T, Fapp, and Fd." },
  { title: "Add coordinate axes", body: "Draw x and y so the directions are easy to name. On a ramp, x runs along the ramp." }
];

const FORCE_GUIDE = [
  ["Weight", "Fg or W", "Straight down"],
  ["Normal", "Fn or N", "Straight out of the surface"],
  ["Friction", "Ff", "Along the surface, against the slide"],
  ["Tension", "T", "Along the rope, away from the object"],
  ["Applied", "Fapp", "The push or pull in the problem"],
  ["Drag", "Fd", "Air pushing against the motion"]
];
const TUTORIAL_TRAY_IDS = ["gravity", "normal", "applied", "friction", "tension"];
const TRAY_IDS = ["gravity", "normal", "applied", "friction", "tension", "drag"];

const DIFF_LABELS = { easy: "Easy", moderate: "Moderate", hard: "Difficult" };

function fbdModel(situation, object, objects, forces, extra) {
  return Object.assign({
    situation: situation,
    object: object,
    objects: objects,
    catalog: ["gravity", "normal", "applied", "friction", "tension", "motion"],
    forces: forces,
    eq: [],
    gt: []
  }, extra || {});
}

const LAW1_PROBLEMS = {
  easy: [
    fbdModel("A 2 kg book rests on a table. Draw the free-body diagram of the book. Use g = 9.8 m/s².", "Book", ["Book", "Table"], [
      { id: "gravity", dir: "down", mag: 20 },
      { id: "normal", dir: "up", mag: 20 }
    ], { eq: [["gravity", "normal"]], why: "At rest, net force is zero. Weight about 20 N down balances the 20 N normal force up." }),
    fbdModel("A 5 kg box sits still on a horizontal floor. Draw the free-body diagram of the box. Use g = 9.8 m/s².", "Box", ["Box", "Floor"], [
      { id: "gravity", dir: "down", mag: 49 },
      { id: "normal", dir: "up", mag: 49 }
    ], { eq: [["gravity", "normal"]], why: "The box is at rest. Fg = 49 N down equals Fn = 49 N up." }),
    fbdModel("An 80 N lamp hangs motionless from a vertical cable. Draw the free-body diagram of the lamp.", "Lamp", ["Lamp"], [
      { id: "gravity", dir: "down", mag: 80 },
      { id: "tension", dir: "up", mag: 80 }
    ], { eq: [["gravity", "tension"]], hanging: true, why: "The lamp is at rest, so tension up equals its 80 N weight down." }),
    fbdModel("A 6 kg puck glides in a straight line at constant speed on smooth, frictionless ice. Draw the free-body diagram of the puck. Use g = 9.8 m/s².", "Puck", ["Puck", "Floor"], [
      { id: "gravity", dir: "down", mag: 59 },
      { id: "normal", dir: "up", mag: 59 }
    ], { eq: [["gravity", "normal"]], why: "Constant velocity means net force is zero. Only weight 59 N down and normal 59 N up act. Ice is frictionless, so no horizontal force." }),
    fbdModel("A 100 N sign hangs at rest from a vertical rope. What is the tension in the rope? Draw the diagram first.", "Sign", ["Sign"], [
      { id: "gravity", dir: "down", mag: 100 },
      { id: "tension", dir: "up", mag: 100 }
    ], { eq: [["gravity", "tension"]], hanging: true, why: "At rest, T = Fg = 100 N.", ask: { q: "What is the tension in the rope?", answer: 100, unit: "N", hint: "The sign weighs 100 N and is at rest, so the upward tension equals the downward weight.", explain: "At rest, ΣF = 0. Tension up = weight down, so T = 100 N.", why: "T = 100 N upward, equal to the weight." } })
  ],
  moderate: [
    fbdModel("A 2 kg book rests on a table. A hand presses straight down on the book with 10 N. The book does not move. Use g = 9.8 m/s².", "Book", ["Book", "Table"], [
      { id: "gravity", dir: "down", mag: 20 },
      { id: "applied", dir: "down", mag: 10 },
      { id: "normal", dir: "up", mag: 30 }
    ], { why: "Three forces on the book: 20 N weight down, 10 N push down, 30 N normal up. Net force is still zero." }),
    fbdModel("A 10 kg crate rests on a floor. A rope pulls straight up with 40 N. The crate does not lift off. Use g = 9.8 m/s².", "Crate", ["Crate", "Floor"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "tension", dir: "up", mag: 40 },
      { id: "normal", dir: "up", mag: 58 }
    ], { why: "Weight 98 N down. Tension 40 N up. The floor still pushes with Fn = 98 − 40 = 58 N up." }),
    fbdModel("An 8 kg suitcase sits on the floor. A person lifts straight up with 30 N. The suitcase stays on the floor. Use g = 9.8 m/s².", "Bag", ["Bag", "Floor"], [
      { id: "gravity", dir: "down", mag: 78 },
      { id: "applied", dir: "up", mag: 30 },
      { id: "normal", dir: "up", mag: 48 }
    ], { why: "Fg = 78 N down, lift 30 N up, Fn = 48 N up. The suitcase is still at rest." }),
    fbdModel("A 50 N lamp hangs from a cable. Someone pulls the lamp straight down with 20 N. The lamp stays at rest.", "Lamp", ["Lamp"], [
      { id: "gravity", dir: "down", mag: 50 },
      { id: "applied", dir: "down", mag: 20 },
      { id: "tension", dir: "up", mag: 70 }
    ], { hanging: true, why: "Weight 50 N down plus 20 N extra pull. Tension must be 70 N up so the lamp does not move.", ask: { q: "What is the tension in the cable?", answer: 70, unit: "N", hint: "Add the two downward forces. Tension balances that sum.", why: "T = 50 N + 20 N = 70 N." } }),
    fbdModel("A 10 kg box is at rest on a 30° rough ramp. Friction holds it still. No rope is attached. Use g = 9.8 m/s².", "Box", ["Box", "Ramp"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "normal", angle: 120, mag: 85 },
      { id: "friction", angle: 30, mag: 49 }
    ], { angle: 30, why: "Weight 98 N straight down. Normal ≈ 85 N out of the ramp. Friction ≈ 49 N up the ramp balances the down-ramp part of weight." })
  ],
  hard: [
    fbdModel("A 10 kg box is pushed to the right with 40 N. It moves at constant velocity on a rough horizontal floor. Use g = 9.8 m/s².", "Box", ["Box", "Floor"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "normal", dir: "up", mag: 98 },
      { id: "applied", dir: "right", mag: 40 },
      { id: "friction", dir: "left", mag: 40 }
    ], { eq: [["gravity", "normal"], ["applied", "friction"]], why: "Constant velocity: net force is zero. Fg 98 N = Fn 98 N. The 40 N push equals 40 N friction.", ask: { q: "What is the frictional force?", answer: 40, unit: "N", hint: "Constant velocity means the horizontal forces cancel.", why: "Ff = 40 N to the left." } }),
    fbdModel("A 15 kg crate is pulled to the right by a rope with 50 N tension. It slides at constant speed on a rough floor. Use g = 9.8 m/s².", "Crate", ["Crate", "Floor"], [
      { id: "gravity", dir: "down", mag: 147 },
      { id: "normal", dir: "up", mag: 147 },
      { id: "tension", dir: "right", mag: 50 },
      { id: "friction", dir: "left", mag: 50 }
    ], { eq: [["gravity", "normal"], ["tension", "friction"]], why: "Constant speed: T = 50 N right is balanced by 50 N friction left. Weight 147 N equals normal 147 N." }),
    fbdModel("A 10 kg box rests on a frictionless 30° ramp. A rope parallel to the ramp holds it still. Use g = 9.8 m/s².", "Box", ["Box", "Ramp"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "normal", angle: 120, mag: 85 },
      { id: "tension", angle: 30, mag: 49 }
    ], { angle: 30, why: "No friction. Weight 98 N down. Normal ≈ 85 N perpendicular to the ramp. Tension 49 N up the ramp = mg sin 30°." }),
    fbdModel("A 20 kg crate is pulled up a rough 30° ramp at constant speed. The cable is parallel to the ramp with T = 124 N. Kinetic friction is 26 N. Use g = 9.8 m/s².", "Crate", ["Crate", "Ramp"], [
      { id: "gravity", dir: "down", mag: 196 },
      { id: "normal", angle: 120, mag: 170 },
      { id: "tension", angle: 30, mag: 124 },
      { id: "friction", angle: 210, mag: 26 }
    ], { angle: 30, why: "Constant speed up the ramp. Weight 196 N down, normal ≈ 170 N, tension 124 N up the ramp, friction 26 N down the ramp." }),
    fbdModel("A 20 kg crate is pulled up a rough 30° ramp at constant speed. Tension along the ramp is 134 N. Kinetic friction is 26 N. A 10 N headwind acts down the ramp. Use g = 9.8 m/s².", "Crate", ["Crate", "Ramp"], [
      { id: "gravity", dir: "down", mag: 196 },
      { id: "normal", angle: 120, mag: 170 },
      { id: "tension", angle: 30, mag: 134 },
      { id: "friction", angle: 210, mag: 26 },
      { id: "drag", angle: 210, mag: 10 }
    ], { angle: 30, why: "Five forces: weight 196 N down, normal ≈ 170 N, tension 134 N up the ramp, friction 26 N and drag 10 N down the ramp. Constant speed, so net force is zero.", ask: { q: "What is the net force on the crate?", answer: 0, unit: "N", hint: "Constant speed means acceleration is zero.", why: "Fnet = 0 N because velocity is constant." } })
  ]
};

const LAW2_PROBLEMS = {
  easy: [
    fbdModel("A 10 kg elevator cabin is pulled upward by a cable. Tension is 120 N. The cabin accelerates upward. Use g = 9.8 m/s².", "Cabin", ["Cabin"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "tension", dir: "up", mag: 120 }
    ], { hanging: true, why: "Two forces: T = 120 N up and Fg = 98 N down. Net force is 22 N up, so it accelerates up.", ask: { q: "What is the acceleration of the cabin?", answer: 2.2, unit: "m/s²", hint: "a = Fnet / m. Fnet = 120 − 98.", why: "a = 22 / 10 = 2.2 m/s² upward." } }),
    fbdModel("A person lifts a 5 kg suitcase straight up with 60 N. The suitcase leaves the floor and speeds up. Use g = 9.8 m/s².", "Bag", ["Bag"], [
      { id: "gravity", dir: "down", mag: 49 },
      { id: "applied", dir: "up", mag: 60 }
    ], { air: true, why: "Only the lift and weight act once it is off the floor. Fapp = 60 N up, Fg = 49 N down." }),
    fbdModel("A 4 kg object is falling. Air drag is 12 N upward. It is still speeding up. Use g = 9.8 m/s².", "Box", ["Box"], [
      { id: "gravity", dir: "down", mag: 39 },
      { id: "drag", dir: "up", mag: 12 }
    ], { air: true, why: "Weight 39 N down is larger than 12 N drag up, so the net force is still down." }),
    fbdModel("A 6 kg load hangs from a cable. Tension is 40 N. The load accelerates downward. Use g = 9.8 m/s².", "Load", ["Load"], [
      { id: "gravity", dir: "down", mag: 59 },
      { id: "tension", dir: "up", mag: 40 }
    ], { hanging: true, why: "Fg = 59 N down, T = 40 N up. Net force is down, so it speeds up while falling.", ask: { q: "What is the magnitude of the net force?", answer: 19, unit: "N", hint: "Subtract the smaller vertical force from the larger one.", why: "Fnet = 59 − 40 = 19 N down." } }),
    fbdModel("An 8 kg skydiver is falling. Drag is 20 N upward. Use g = 9.8 m/s².", "Diver", ["Diver"], [
      { id: "gravity", dir: "down", mag: 78 },
      { id: "drag", dir: "up", mag: 20 }
    ], { air: true, why: "Weight 78 N down and drag 20 N up. Not yet terminal speed, so there is a downward net force." })
  ],
  moderate: [
    fbdModel("A 10 kg crate sits on a smooth, frictionless floor. A rope pulls it to the right with 30 N. Use g = 9.8 m/s².", "Crate", ["Crate", "Floor"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "normal", dir: "up", mag: 98 },
      { id: "tension", dir: "right", mag: 30 }
    ], { eq: [["gravity", "normal"]], why: "No friction. Only T = 30 N is horizontal, so that is the net force.", ask: { q: "What is the acceleration of the crate?", answer: 3, unit: "m/s²", hint: "a = Fnet / m. The net force is the 30 N tension.", why: "a = 30 / 10 = 3 m/s² to the right." } }),
    fbdModel("A 5 kg box on ice is pushed to the right with 20 N. The ice is frictionless. Use g = 9.8 m/s².", "Box", ["Box", "Floor"], [
      { id: "gravity", dir: "down", mag: 49 },
      { id: "normal", dir: "up", mag: 49 },
      { id: "applied", dir: "right", mag: 20 }
    ], { eq: [["gravity", "normal"]], why: "Three forces: 49 N down, 49 N up, 20 N right. Acceleration is to the right.", ask: { q: "What is the acceleration?", answer: 4, unit: "m/s²", hint: "a = 20 / 5.", why: "a = 20 / 5 = 4 m/s² to the right." } }),
    fbdModel("An 8 kg wagon is pulled to the right with 40 N on a frictionless path. Use g = 9.8 m/s².", "Wagon", ["Wagon", "Floor"], [
      { id: "gravity", dir: "down", mag: 78 },
      { id: "normal", dir: "up", mag: 78 },
      { id: "tension", dir: "right", mag: 40 }
    ], { eq: [["gravity", "normal"]], why: "Weight and normal cancel. T = 40 N is the net force." }),
    fbdModel("A 12 kg crate is pushed to the right with 36 N on a frictionless floor. Use g = 9.8 m/s².", "Crate", ["Crate", "Floor"], [
      { id: "gravity", dir: "down", mag: 118 },
      { id: "normal", dir: "up", mag: 118 },
      { id: "applied", dir: "right", mag: 36 }
    ], { eq: [["gravity", "normal"]], why: "Fnet = 36 N right. Vertical forces cancel.", ask: { q: "What is the acceleration?", answer: 3, unit: "m/s²", hint: "a = 36 / 12.", why: "a = 36 / 12 = 3 m/s² to the right." } }),
    fbdModel("A 20 kg sled is pulled to the right with 50 N on smooth ice. Use g = 9.8 m/s².", "Sled", ["Sled", "Floor"], [
      { id: "gravity", dir: "down", mag: 196 },
      { id: "normal", dir: "up", mag: 196 },
      { id: "tension", dir: "right", mag: 50 }
    ], { eq: [["gravity", "normal"]], why: "Three forces. Net force is 50 N right, so a = 50 / 20 = 2.5 m/s²." })
  ],
  hard: [
    fbdModel("A worker pushes a 15 kg box to the right with 50 N on a rough floor. μk = 0.2. Use g = 9.8 m/s².", "Box", ["Box", "Floor"], [
      { id: "gravity", dir: "down", mag: 147 },
      { id: "normal", dir: "up", mag: 147 },
      { id: "applied", dir: "right", mag: 50 },
      { id: "friction", dir: "left", mag: 29 }
    ], { eq: [["gravity", "normal"]], why: "Fn = 147 N. Ff = 0.2 × 147 ≈ 29 N left. Fnet ≈ 21 N right.", ask: { q: "What is the acceleration? Round to 1 decimal place.", answer: 1.4, unit: "m/s²", hint: "Fnet = 50 − 29. Then divide by 15 kg.", why: "a = 21 / 15 = 1.4 m/s² to the right." } }),
    fbdModel("A 10 kg crate is pulled right by a 60 N rope. Kinetic friction is 22 N left. Use g = 9.8 m/s².", "Crate", ["Crate", "Floor"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "normal", dir: "up", mag: 98 },
      { id: "tension", dir: "right", mag: 60 },
      { id: "friction", dir: "left", mag: 22 }
    ], { eq: [["gravity", "normal"]], why: "Fnet = 60 − 22 = 38 N right. a = 38 / 10 = 3.8 m/s²." }),
    fbdModel("A 12 kg box is pushed to the right with 80 N. Kinetic friction is 20 N. Use g = 9.8 m/s².", "Box", ["Box", "Floor"], [
      { id: "gravity", dir: "down", mag: 118 },
      { id: "normal", dir: "up", mag: 118 },
      { id: "applied", dir: "right", mag: 80 },
      { id: "friction", dir: "left", mag: 20 }
    ], { eq: [["gravity", "normal"]], why: "Four forces. Fnet = 80 − 20 = 60 N right. a = 60 / 12 = 5 m/s².", ask: { q: "What is the acceleration?", answer: 5, unit: "m/s²", hint: "Fnet = 80 − 20.", why: "a = 60 / 12 = 5 m/s² to the right." } }),
    fbdModel("A 20 kg crate is pulled up a rough 30° ramp. T = 150 N along the ramp. μk = 0.15. Use g = 9.8 m/s².", "Crate", ["Crate", "Ramp"], [
      { id: "gravity", dir: "down", mag: 196 },
      { id: "normal", angle: 120, mag: 170 },
      { id: "tension", angle: 30, mag: 150 },
      { id: "friction", angle: 210, mag: 25 }
    ], { angle: 30, why: "Weight 196 N, normal ≈ 170 N, tension 150 N up the ramp, friction ≈ 25 N down the ramp." }),
    fbdModel("A 20 kg crate is pulled up a rough 30° ramp. T = 150 N along the ramp. μk = 0.15. A 10 N headwind acts down the ramp. Use g = 9.8 m/s².", "Crate", ["Crate", "Ramp"], [
      { id: "gravity", dir: "down", mag: 196 },
      { id: "normal", angle: 120, mag: 170 },
      { id: "tension", angle: 30, mag: 150 },
      { id: "friction", angle: 210, mag: 25 },
      { id: "drag", angle: 210, mag: 10 }
    ], { angle: 30, why: "Five forces: weight, normal, tension up the ramp, friction and drag down the ramp." })
  ]
};

const LAW3_PROBLEMS = {
  easy: [
    fbdModel("A book rests on a table. Weight and the normal force on the book are each 50 N. Draw only the forces on the book.", "Book", ["Book", "Table"], [
      { id: "gravity", dir: "down", mag: 50 },
      { id: "normal", dir: "up", mag: 50 }
    ], { eq: [["gravity", "normal"]], why: "On the book: 50 N down (Earth on the book) and 50 N up (table on the book). Do not draw the book’s push on the table." }),
    fbdModel("A 5 kg box is at rest on a floor. Draw only the forces on the box. Use g = 9.8 m/s².", "Box", ["Box", "Floor"], [
      { id: "gravity", dir: "down", mag: 49 },
      { id: "normal", dir: "up", mag: 49 }
    ], { eq: [["gravity", "normal"]], why: "Forces on the box: 49 N down and 49 N up. The box’s push on the floor belongs on the floor’s diagram." }),
    fbdModel("An 8 kg crate sits still on a warehouse floor. Draw only the forces on the crate. Use g = 9.8 m/s².", "Crate", ["Crate", "Floor"], [
      { id: "gravity", dir: "down", mag: 78 },
      { id: "normal", dir: "up", mag: 78 }
    ], { eq: [["gravity", "normal"]], why: "78 N down and 78 N up act on the crate." }),
    fbdModel("A 30 N laptop rests on a desk. Draw only the forces on the laptop.", "Laptop", ["Laptop", "Table"], [
      { id: "gravity", dir: "down", mag: 30 },
      { id: "normal", dir: "up", mag: 30 }
    ], { eq: [["gravity", "normal"]], why: "Earth pulls the laptop down 30 N. The desk pushes the laptop up 30 N." }),
    fbdModel("A 2 kg apple sits on a table. Draw only the forces on the apple. Use g = 9.8 m/s².", "Apple", ["Apple", "Table"], [
      { id: "gravity", dir: "down", mag: 20 },
      { id: "normal", dir: "up", mag: 20 }
    ], { eq: [["gravity", "normal"]], why: "About 20 N down and 20 N up on the apple only." })
  ],
  moderate: [
    fbdModel("A 10 kg box is on a horizontal surface. A person pushes it right with 40 N. The surface pushes up with 98 N. No friction is given. Draw forces on the box only.", "Box", ["Box", "Floor"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "normal", dir: "up", mag: 98 },
      { id: "applied", dir: "right", mag: 40 }
    ], { eq: [["gravity", "normal"]], why: "On the box: weight 98 N, normal 98 N, and the 40 N push. Do not draw the box pushing the person." }),
    fbdModel("A 6 kg sled on ice is pulled right with 24 N. Ice friction is not given. Draw forces on the sled. Use g = 9.8 m/s².", "Sled", ["Sled", "Floor"], [
      { id: "gravity", dir: "down", mag: 59 },
      { id: "normal", dir: "up", mag: 59 },
      { id: "tension", dir: "right", mag: 24 }
    ], { eq: [["gravity", "normal"]], why: "Three forces on the sled: 59 N down, 59 N up, 24 N tension right." }),
    fbdModel("A 12 kg crate is pushed right with 36 N. The floor’s normal force is 118 N. Draw only the forces on the crate. Use g = 9.8 m/s².", "Crate", ["Crate", "Floor"], [
      { id: "gravity", dir: "down", mag: 118 },
      { id: "normal", dir: "up", mag: 118 },
      { id: "applied", dir: "right", mag: 36 }
    ], { eq: [["gravity", "normal"]], why: "Draw Earth on the crate, floor on the crate, and person on the crate. Skip the crate’s forces on them." }),
    fbdModel("A 4 kg cart is pulled right by a 18 N rope on a smooth floor. Draw forces on the cart. Use g = 9.8 m/s².", "Cart", ["Cart", "Floor"], [
      { id: "gravity", dir: "down", mag: 39 },
      { id: "normal", dir: "up", mag: 39 },
      { id: "tension", dir: "right", mag: 18 }
    ], { eq: [["gravity", "normal"]], why: "Fg 39 N, Fn 39 N, T 18 N. The cart’s pull on the rope is not on this diagram." }),
    fbdModel("A 15 kg box is pushed right with 45 N. Normal force is 147 N. Draw only the forces on the box. Use g = 9.8 m/s².", "Box", ["Box", "Floor"], [
      { id: "gravity", dir: "down", mag: 147 },
      { id: "normal", dir: "up", mag: 147 },
      { id: "applied", dir: "right", mag: 45 }
    ], { eq: [["gravity", "normal"]], why: "Three forces on the box. The equal-and-opposite push on the person is on a different object." })
  ],
  hard: [
    fbdModel("A 10 kg crate is pulled right by a 60 N rope on a rough floor. Kinetic friction is 22 N left. The floor pushes up with 98 N. Draw only the forces on the crate.", "Crate", ["Crate", "Floor"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "normal", dir: "up", mag: 98 },
      { id: "tension", dir: "right", mag: 60 },
      { id: "friction", dir: "left", mag: 22 }
    ], { eq: [["gravity", "normal"]], why: "Four forces on the crate: 98 N down, 98 N up, 60 N right, 22 N left." }),
    fbdModel("A 8 kg box is pushed right with 50 N. Kinetic friction is 18 N. Draw only the forces on the box. Use g = 9.8 m/s².", "Box", ["Box", "Floor"], [
      { id: "gravity", dir: "down", mag: 78 },
      { id: "normal", dir: "up", mag: 78 },
      { id: "applied", dir: "right", mag: 50 },
      { id: "friction", dir: "left", mag: 18 }
    ], { eq: [["gravity", "normal"]], why: "On the box: weight, normal, push, and friction. Not the box’s push on the person." }),
    fbdModel("A 12 kg crate is pulled right with 70 N. Friction is 25 N left. Draw forces on the crate only. Use g = 9.8 m/s².", "Crate", ["Crate", "Floor"], [
      { id: "gravity", dir: "down", mag: 118 },
      { id: "normal", dir: "up", mag: 118 },
      { id: "tension", dir: "right", mag: 70 },
      { id: "friction", dir: "left", mag: 25 }
    ], { eq: [["gravity", "normal"]], why: "Fg 118 N, Fn 118 N, T 70 N, Ff 25 N — all on the crate." }),
    fbdModel("A 15 kg box is pushed right with 80 N on a rough floor. μk = 0.2. Draw only the forces on the box. Use g = 9.8 m/s².", "Box", ["Box", "Floor"], [
      { id: "gravity", dir: "down", mag: 147 },
      { id: "normal", dir: "up", mag: 147 },
      { id: "applied", dir: "right", mag: 80 },
      { id: "friction", dir: "left", mag: 29 }
    ], { eq: [["gravity", "normal"]], why: "Ff = 0.2 × 147 ≈ 29 N. Four forces on the box.", ask: { q: "What is the frictional force on the box?", answer: 29, unit: "N", hint: "Ff = μk Fn and Fn = mg.", why: "Ff ≈ 0.2 × 147 = 29 N left." } }),
    fbdModel("A 10 kg crate is pulled right with 55 N. Friction is 15 N left. Drag is 5 N left. Draw only the forces on the crate. Use g = 9.8 m/s².", "Crate", ["Crate", "Floor"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "normal", dir: "up", mag: 98 },
      { id: "tension", dir: "right", mag: 55 },
      { id: "friction", dir: "left", mag: 15 },
      { id: "drag", dir: "left", mag: 5 }
    ], { eq: [["gravity", "normal"]], why: "Five forces on this one object: weight, normal, tension, friction, and drag." })
  ]
};

function getLawProblems(law, diff) {
  if (law === 1) return LAW1_PROBLEMS[diff];
  if (law === 2) return LAW2_PROBLEMS[diff];
  if (law === 3) return LAW3_PROBLEMS[diff];
  return null;
}

const CHALLENGE_POOL = [
  {
    key: "c1",
    title: "Problem 1",
    model: fbdModel("A 5 kg box is at rest on a horizontal table. Draw the free-body diagram. Use g = 9.8 m/s².", "Box", ["Box", "Table"], [
      { id: "gravity", dir: "down", mag: 49 },
      { id: "normal", dir: "up", mag: 49 }
    ], { eq: [["gravity", "normal"]], why: "At rest: weight 49 N down equals normal 49 N up." })
  },
  {
    key: "c2",
    title: "Problem 2",
    model: fbdModel("A 10 kg crate on a frictionless floor is pulled right with 30 N. Draw the diagram, then find the acceleration. Use g = 9.8 m/s².", "Crate", ["Crate", "Floor"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "normal", dir: "up", mag: 98 },
      { id: "tension", dir: "right", mag: 30 }
    ], { eq: [["gravity", "normal"]], why: "Vertical forces cancel. Fnet = 30 N right.", ask: { q: "What is the acceleration?", answer: 3, unit: "m/s²", hint: "a = Fnet / m.", why: "a = 30 / 10 = 3 m/s² to the right." } })
  },
  {
    key: "c3",
    title: "Problem 3",
    model: fbdModel("A book rests on a table. Weight and the normal force on the book are each 50 N. Draw only the forces on the book.", "Book", ["Book", "Table"], [
      { id: "gravity", dir: "down", mag: 50 },
      { id: "normal", dir: "up", mag: 50 }
    ], { eq: [["gravity", "normal"]], why: "Draw Earth on the book and the table on the book. Do not draw the book’s push on the table." })
  },
  {
    key: "c4",
    title: "Problem 4",
    model: fbdModel("A 10 kg block slides down a frictionless 30° incline. Draw the diagram, then find the acceleration. Use g = 9.8 m/s².", "Block", ["Block", "Ramp"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "normal", angle: 120, mag: 85 }
    ], { angle: 30, why: "Weight 98 N down and normal ≈ 85 N. Then a = g sin 30°.", ask: { q: "What is the acceleration down the incline?", answer: 4.9, unit: "m/s²", hint: "a = g sin 30°.", why: "a = 9.8 × 0.5 = 4.9 m/s² down the incline." } })
  },
  {
    key: "c5",
    title: "Problem 5",
    model: fbdModel("A 10 kg box is pushed right with 40 N and moves at constant velocity on a rough floor. Draw the diagram. Use g = 9.8 m/s².", "Box", ["Box", "Floor"], [
      { id: "gravity", dir: "down", mag: 98 },
      { id: "normal", dir: "up", mag: 98 },
      { id: "applied", dir: "right", mag: 40 },
      { id: "friction", dir: "left", mag: 40 }
    ], { eq: [["gravity", "normal"], ["applied", "friction"]], why: "Constant velocity: net force is zero. Friction equals the 40 N push.", ask: { q: "What is the net force?", answer: 0, unit: "N", hint: "Constant velocity means acceleration is zero.", why: "Fnet = 0 N." } })
  }
];

const sfx = (function () {
  let ctx = null;
  function ac() {
    if (!ctx) try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    return ctx;
  }
  function tone(freq, dur, type, vol) {
    const c = ac();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.value = vol || 0.07;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  }
  let lastAt = 0;
  function gated(fn) {
    const now = Date.now();
    if (now - lastAt < 140) return;
    lastAt = now;
    fn();
  }
  return {
    unlock() {
      const c = ac();
      if (c && c.state === "suspended") c.resume();
    },
    ok() { gated(() => { tone(523, 0.09, "sine", 0.07); window.setTimeout(() => tone(784, 0.14, "sine", 0.06), 70); }); },
    bad() { gated(() => { tone(196, 0.12, "square", 0.05); window.setTimeout(() => tone(147, 0.18, "square", 0.045), 80); }); },
    tick() { tone(500, 0.03, "triangle", 0.03); }
  };
})();

function unlockAudio() {
  sfx.unlock();
}
document.addEventListener("pointerdown", unlockAudio, { once: false, passive: true });

function hapticWrong() { if (navigator.vibrate) navigator.vibrate([35, 25, 35]); }
let flashWrongTimer = 0;
function flashWrong() {
  if (flashWrongTimer) return;
  document.body.classList.add("is-wrong-flash");
  flashWrongTimer = window.setTimeout(() => {
    document.body.classList.remove("is-wrong-flash");
    flashWrongTimer = 0;
  }, 450);
}
function feedbackWrong() { hapticWrong(); flashWrong(); sfx.bad(); }
function feedbackRight() { sfx.ok(); }

const FORCE = {
  gravity: { label: "Weight", symbol: "Fg", color: "#6e4b3a", dir: "down" },
  normal: { label: "Normal force", symbol: "Fn", color: "#0f6e6a", dir: "up" },
  applied: { label: "Applied force", symbol: "Fapp", color: "#c05622", dir: "right" },
  friction: { label: "Friction", symbol: "Ff", color: "#9d4034", dir: "left" },
  tension: { label: "Tension", symbol: "T", color: "#31457a", dir: "up" },
  drag: { label: "Drag", symbol: "Fd", color: "#3d6b8a", dir: "left" },
  motion: { label: "Force of motion", symbol: "?", color: "#6c7570", dir: "right" }
};

const DIRS = [
  ["up", "↑", "Up"],
  ["down", "↓", "Down"],
  ["left", "←", "Left"],
  ["right", "→", "Right"]
];

const KEY = "physics-airea-progress-v3";
const TIMER_STORE_KEY = "physics-airea-timer-v1";

function blank() {
  return { v: 3, tutorial: 0, solved: {}, challenge: 0, task: { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} }, best: {}, flag: {}, final: {} };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (!raw || raw.v !== 3) return blank();
    raw.solved = raw.solved || {};
    raw.task = Object.assign({ 1: {}, 2: {}, 3: {}, 4: {}, 5: {} }, raw.task);
    raw.best = raw.best || {};
    raw.flag = raw.flag || {};
    raw.final = raw.final || {};
    return raw;
  } catch (err) {
    return blank();
  }
}

function problemKey(law, diff, n) { return "law" + law + "." + diff + ".p" + n; }
function isProblemSolved(key) { return !!store.data.solved[key]; }
function markProblemSolved(key) {
  if (store.data.solved[key]) return;
  store.data.solved[key] = 1;
  store.save();
}
function tutorialDone() { return store.data.tutorial >= 1; }
function law1Unlocked() { return tutorialDone(); }
function lawIntroSeen(id) { return store.flag("lawintro." + id); }
function markLawIntroSeen(id) { store.setFlag("lawintro." + id); }
function eachLawProblem(fn) {
  for (let law = 1; law <= 3; law += 1) {
    ["easy", "moderate", "hard"].forEach((diff) => {
      const set = getLawProblems(law, diff) || [];
      set.forEach((_, i) => fn(law, diff, i + 1, set));
    });
  }
}
function problemUnlocked(law, diff, n) {
  if (!diffUnlocked(law, diff)) return false;
  if (n <= 1) return true;
  return isProblemSolved(problemKey(law, diff, n - 1));
}
function tierComplete(law, diff) {
  const set = getLawProblems(law, diff);
  if (!set) return false;
  return set.every((_, i) => isProblemSolved(problemKey(law, diff, i + 1)));
}
function lawSolvedCount(law) {
  let n = 0;
  ["easy", "moderate", "hard"].forEach((diff) => {
    const set = getLawProblems(law, diff) || [];
    set.forEach((_, i) => { if (isProblemSolved(problemKey(law, diff, i + 1))) n += 1; });
  });
  return n;
}
function lawProblemCount(law) {
  let n = 0;
  ["easy", "moderate", "hard"].forEach((diff) => { n += (getLawProblems(law, diff) || []).length; });
  return n;
}
function law2Unlocked() { return tierComplete(1, "hard"); }
function law3Unlocked() { return tierComplete(2, "hard"); }
function diffUnlocked(law, diff) {
  if (law === 1 && !law1Unlocked()) return false;
  if (law === 2 && !law2Unlocked()) return false;
  if (law === 3 && !law3Unlocked()) return false;
  if (diff === "easy") return true;
  if (diff === "moderate") return tierComplete(law, "easy");
  if (diff === "hard") return tierComplete(law, "moderate");
  return false;
}
function challengeUnlocked() {
  return tierComplete(3, "hard");
}
function courseComplete() {
  return tutorialDone() && tierComplete(1, "hard") && tierComplete(2, "hard") && tierComplete(3, "hard") && challengeAllDone();
}

const store = {
  data: load(),
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (err) { /* private mode */ }
    if (this.painting) return;
    this.painting = true;
    try { refreshProgressUI(); } finally { this.painting = false; }
  },
  task(session, key) {
    return this.data.task[session][key] || 0;
  },
  setTask(session, key, value) {
    const cur = this.task(session, key);
    const next = Math.max(cur, value);
    if (next === cur) return;
    this.data.task[session][key] = next;
    this.save();
  },
  putTask(session, key, value) {
    if (this.task(session, key) === value) return;
    this.data.task[session][key] = value;
    this.save();
  },
  flag(key) { return !!this.data.flag[key]; },
  setFlag(key) {
    if (this.data.flag[key]) return;
    this.data.flag[key] = 1;
    this.save();
  },
  reset() {
    this.data = blank();
    clearTimerStore();
    this.save();
    setAdminEnabled(false);
    route();
  }
};

function sessionPercent(id) {
  let total = 0;
  WEIGHT[id].forEach(([key, weight]) => { total += store.task(id, key) * weight; });
  return Math.round(total);
}

function isComplete(id) {
  return WEIGHT[id].every(([key]) => store.task(id, key) >= 1);
}

function isUnlocked(id) {
  return id === 1 || isComplete(id - 1);
}

function finalDoneCount() {
  let n = 0;
  for (let i = 1; i <= 5; i++) if ((store.data.final[i] || 0) >= 1) n++;
  return n;
}

function isFinalUnlocked() { return isComplete(5); }
function isFinalComplete() { return finalDoneCount() === 5; }

function completedSessions() {
  return SESSIONS.filter((s) => isComplete(s.id)).length;
}

function el(tag, attrs) {
  const node = document.createElement(tag);
  const children = Array.prototype.slice.call(arguments, 2);
  if (attrs) {
    Object.keys(attrs).forEach((key) => {
      const value = attrs[key];
      if (value == null || value === false) return;
      if (key === "class") node.className = value;
      else node.setAttribute(key, value === true ? "" : value);
    });
  }
  children.flat().forEach((child) => {
    if (child == null || child === false) return;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  });
  return node;
}

function svgMarkup(viewBox, inner) {
  const holder = document.createElement("div");
  holder.innerHTML = '<svg viewBox="' + viewBox + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + inner + "</svg>";
  return holder.firstChild;
}

function segments(pct) {
  const filled = Math.max(0, Math.min(10, Math.round(pct / 10)));
  const row = el("div", { class: "segs", role: "img", "aria-label": pct + " percent" });
  for (let i = 0; i < 10; i++) row.append(el("i", { class: i < filled ? "on" : "" }));
  return row;
}

function meterLine(pct, locked) {
  const line = el("div", { class: "meter-line" });
  line.append(segments(locked ? 0 : pct));
  line.append(el("strong", {}, locked ? "Locked" : pct + "%"));
  return line;
}

function letter(index) {
  return el("span", { class: "letter" }, String.fromCharCode(65 + index));
}

function announce(text) {
  const live = document.getElementById("live");
  if (live) live.textContent = text;
}

function cardShell() {
  return el("section", { class: "card" });
}

function statusName(id) {
  if (!isUnlocked(id)) return "Locked";
  if (isComplete(id)) return "Complete";
  if (sessionPercent(id) === 0) return "Not started";
  return "In progress";
}

function pathCard(session) {
  const locked = !isUnlocked(session.id);
  const pct = sessionPercent(session.id);
  const node = el(locked ? "div" : "a", {
    class: "path-card tone-" + session.id + (locked ? " is-locked" : ""),
    href: locked ? null : "#/session/" + session.id,
    "data-session": session.id
  });
  node.append(el("div", { class: "medal" },
    el("span", { class: "medal__number" }, String(session.id).padStart(2, "0")),
    el("span", { class: "medal__icon", "aria-hidden": "true" }, ["↗", "Σ", "⇄", "✦", "∆"][session.id - 1])
  ));
  const body = el("div");
  body.append(el("div", { class: "status" }, statusName(session.id)));
  body.append(el("h3", {}, "Session " + session.id + ": " + session.title));
  body.append(el("p", {}, locked ? "Finish Session " + (session.id - 1) + " to unlock this one." : session.blurb));
  body.append(meterLine(pct, locked));
  if (!locked) body.append(el("span", { class: "card-action" }, pct > 0 ? "Resume mission" : "Start mission", el("b", { "aria-hidden": "true" }, "↗")));
  node.append(body);
  return node;
}

function pathList() {
  return el("div", { class: "path" }, SESSIONS.map(pathCard));
}

const ILLU = {
  book: '<rect x="30" y="168" width="300" height="16" rx="2" fill="#cbb89a"/><rect x="120" y="110" width="120" height="58" rx="6" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/><line x1="180" y1="125" x2="180" y2="78" stroke="#0f6e6a" stroke-width="5"/><polygon points="180,64 172,80 188,80" fill="#0f6e6a"/><line x1="180" y1="150" x2="180" y2="200" stroke="#6e4b3a" stroke-width="5"/><polygon points="180,214 172,198 188,198" fill="#6e4b3a"/><text x="196" y="86" fill="#0f6e6a" font-size="16" font-weight="700">FN</text><text x="196" y="208" fill="#6e4b3a" font-size="16" font-weight="700">Fg</text>',
  bus: '<rect x="40" y="80" width="250" height="80" rx="12" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/><circle cx="90" cy="170" r="16" fill="none" stroke="#1c2a24" stroke-width="3"/><circle cx="230" cy="170" r="16" fill="none" stroke="#1c2a24" stroke-width="3"/><circle cx="150" cy="112" r="10" fill="#31457a"/><path d="M168 112h36" stroke="#c05622" stroke-width="4" stroke-linecap="round"/><polygon points="214,112 198,104 198,120" fill="#c05622"/><text x="40" y="50" fill="#5c6b62" font-size="16">bus slows</text>',
  lamp: '<line x1="180" y1="20" x2="180" y2="78" stroke="#31457a" stroke-width="4"/><rect x="150" y="78" width="60" height="36" rx="6" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/><line x1="180" y1="96" x2="180" y2="150" stroke="#6e4b3a" stroke-width="5"/><polygon points="180,162 172,146 188,146" fill="#6e4b3a"/><line x1="180" y1="78" x2="180" y2="36" stroke="#31457a" stroke-width="5"/><polygon points="180,24 172,40 188,40" fill="#31457a"/><text x="196" y="48" fill="#31457a" font-size="16" font-weight="700">FT</text><text x="196" y="156" fill="#6e4b3a" font-size="16" font-weight="700">Fg</text>',
  pair: '<circle cx="90" cy="110" r="28" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/><rect x="200" y="78" width="70" height="64" rx="6" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/><line x1="118" y1="110" x2="176" y2="110" stroke="#c05622" stroke-width="5"/><polygon points="188,110 172,102 172,118" fill="#c05622"/><line x1="200" y1="110" x2="150" y2="110" stroke="#31457a" stroke-width="5"/><polygon points="138,110 154,102 154,118" fill="#31457a"/><text x="70" y="160" fill="#5c6b62" font-size="14">object A</text><text x="200" y="160" fill="#5c6b62" font-size="14">object B</text>'
};

function figure(name, caption) {
  const box = el("figure", { class: "illu" });
  box.append(svgMarkup("0 0 360 210", ILLU[name]));
  if (caption) box.append(el("figcaption", { class: "hero__cap" }, caption));
  return box;
}

function heroToy() {
  const root = el("div", { class: "toy" });
  const field = el("div", { class: "toy__field" });
  const read = el("p", { class: "hero__cap" }, "Grab a block. Flick it.");
  const spark = el("div", { class: "toy__spark", "aria-hidden": "true" }, el("i", { class: "toy__arrow toy__arrow--a" }), el("i", { class: "toy__arrow toy__arrow--b" }));
  const bodies = [
    { node: el("button", { class: "toy__body", type: "button", "aria-label": "Crate, 3 kilograms. Drag to move, let go to flick." }, "crate", el("small", {}, "3 kg")), x: 28, y: 80, vx: 0, vy: 0, w: 84, h: 60, mass: 3 },
    { node: el("button", { class: "toy__body toy__body--dot", type: "button", "aria-label": "Ball, 1 kilogram. Drag to move, let go to flick." }, "ball", el("small", {}, "1 kg")), x: 180, y: 28, vx: 0, vy: 0, w: 54, h: 54, mass: 1 }
  ];
  let hold = null;
  let laidOut = false;
  let hitUntil = 0;
  field.append(spark);

  function inverseMass(body) {
    return hold && hold.body === body ? 0 : 1 / body.mass;
  }

  function flash(node) {
    node.classList.remove("is-hit");
    void node.offsetWidth;
    node.classList.add("is-hit");
  }

  function collide(rect) {
    const crate = bodies[0];
    const ball = bodies[1];
    const r = ball.w / 2;
    const cx = ball.x + r;
    const cy = ball.y + r;
    const px = clamp(cx, crate.x, crate.x + crate.w);
    const py = clamp(cy, crate.y, crate.y + crate.h);
    let nx = cx - px;
    let ny = cy - py;
    let dist = Math.hypot(nx, ny);
    if (dist >= r) return;
    if (dist < 0.001) {
      nx = cx - (crate.x + crate.w / 2);
      ny = cy - (crate.y + crate.h / 2);
      dist = Math.hypot(nx, ny) || 1;
    }
    nx /= dist;
    ny /= dist;
    const ia = inverseMass(crate);
    const ib = inverseMass(ball);
    const total = ia + ib;
    if (total === 0) return;
    const overlap = r - Math.min(dist, r);
    crate.x = clamp(crate.x - nx * overlap * ia / total, 0, rect.width - crate.w);
    crate.y = clamp(crate.y - ny * overlap * ia / total, 0, rect.height - crate.h);
    ball.x = clamp(ball.x + nx * overlap * ib / total, 0, rect.width - ball.w);
    ball.y = clamp(ball.y + ny * overlap * ib / total, 0, rect.height - ball.h);
    const closing = (ball.vx - crate.vx) * nx + (ball.vy - crate.vy) * ny;
    if (closing >= 0) return;
    const impulse = -(1 + 0.8) * closing / total;
    crate.vx -= impulse * nx * ia;
    crate.vy -= impulse * ny * ia;
    ball.vx += impulse * nx * ib;
    ball.vy += impulse * ny * ib;
    if (impulse > 0.6) {
      spark.style.transform = "translate3d(" + px + "px," + py + "px,0) rotate(" + Math.atan2(ny, nx) + "rad)";
      flash(spark);
      flash(crate.node);
      flash(ball.node);
      hitUntil = performance.now() + 1400;
    }
  }

  function place(body) {
    body.node.style.transform = "translate3d(" + body.x + "px," + body.y + "px,0)";
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function layoutStart() {
    const rect = field.getBoundingClientRect();
    if (rect.width < 40) return;
    bodies[0].x = rect.width * 0.1;
    bodies[0].y = rect.height * 0.48;
    bodies[1].x = rect.width * 0.62;
    bodies[1].y = rect.height * 0.16;
    bodies.forEach(place);
    laidOut = true;
  }

  bodies.forEach((body) => {
    body.node.addEventListener("pointerdown", (event) => {
      if (!laidOut) layoutStart();
      body.node.setPointerCapture(event.pointerId);
      hold = { body: body, id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now() };
      body.vx = 0;
      body.vy = 0;
      body.node.classList.add("is-held");
    });
    body.node.addEventListener("pointermove", (event) => {
      if (!hold || hold.id !== event.pointerId || hold.body !== body) return;
      const rect = field.getBoundingClientRect();
      const now = performance.now();
      const dt = Math.max(8, now - hold.t);
      const dx = event.clientX - hold.x;
      const dy = event.clientY - hold.y;
      hold.x = event.clientX;
      hold.y = event.clientY;
      hold.t = now;
      body.x = clamp(body.x + dx, 0, rect.width - body.w);
      body.y = clamp(body.y + dy, 0, rect.height - body.h);
      body.vx = dx / dt * 16;
      body.vy = dy / dt * 16;
      place(body);
    });
    function release(event) {
      if (!hold || hold.id !== event.pointerId || hold.body !== body) return;
      body.node.classList.remove("is-held");
      hold = null;
    }
    body.node.addEventListener("pointerup", release);
    body.node.addEventListener("pointercancel", release);
    field.append(body.node);
  });

  function tick() {
    if (!root.isConnected) return;
    const rect = field.getBoundingClientRect();
    if (!laidOut) layoutStart();
    if (rect.width > 40) {
      bodies.forEach((body) => {
        if (hold && hold.body === body) {
          if (performance.now() - hold.t > 60) { body.vx = 0; body.vy = 0; }
          return;
        }
        body.x += body.vx;
        body.y += body.vy;
        body.vx *= 0.985;
        body.vy *= 0.985;
        if (Math.abs(body.vx) < 0.04) body.vx = 0;
        if (Math.abs(body.vy) < 0.04) body.vy = 0;
        const maxX = Math.max(0, rect.width - body.w);
        const maxY = Math.max(0, rect.height - body.h);
        if (body.x <= 0) { body.x = 0; body.vx = Math.abs(body.vx) * 0.7; }
        if (body.y <= 0) { body.y = 0; body.vy = Math.abs(body.vy) * 0.7; }
        if (body.x >= maxX) { body.x = maxX; body.vx = -Math.abs(body.vx) * 0.7; }
        if (body.y >= maxY) { body.y = maxY; body.vy = -Math.abs(body.vy) * 0.7; }
      });
      collide(rect);
      bodies.forEach(place);
      const speed = Math.max(...bodies.map((body) => Math.hypot(body.vx, body.vy)));
      let label;
      if (performance.now() < hitUntil) label = "Equal push, opposite way. The 1 kg ball flies more.";
      else if (hold) label = "You are the force. Ram the other one.";
      else if (speed > 0.35) label = "Coasting. No new force, still moving.";
      else label = "At rest. Net force is zero.";
      if (read.textContent !== label) read.textContent = label;
    }
    requestAnimationFrame(tick);
  }

  const controls = el("div", { class: "toy__controls" });
  [["← Push", -1], ["Stop", 0], ["Push →", 1]].forEach(([label, dir]) => {
    const button = el("button", { type: "button" }, label);
    button.addEventListener("click", () => {
      if (dir === 0) {
        bodies.forEach((body) => { body.vx = 0; body.vy = 0; });
        return;
      }
      bodies[0].vx += dir * 8;
      bodies[0].vy += (Math.random() - 0.5) * 1.4;
    });
    controls.append(button);
  });
  root.append(field, controls, read);
  requestAnimationFrame(tick);
  return root;
}

function heroArt() {
  return svgMarkup("0 0 360 250",
    '<g class="floaty"><rect x="145" y="92" width="70" height="56" rx="8" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/>' +
    '<line class="draw" x1="180" y1="120" x2="180" y2="48" stroke="#0f6e6a" stroke-width="6" stroke-linecap="round"/>' +
    '<line class="draw" style="animation-delay:.15s" x1="180" y1="120" x2="180" y2="198" stroke="#6e4b3a" stroke-width="6" stroke-linecap="round"/>' +
    '<line class="draw" style="animation-delay:.3s" x1="180" y1="120" x2="292" y2="120" stroke="#c05622" stroke-width="6" stroke-linecap="round"/>' +
    '<line class="draw" style="animation-delay:.45s" x1="180" y1="120" x2="68" y2="120" stroke="#9d4034" stroke-width="6" stroke-linecap="round"/>' +
    '<polygon points="180,36 170,54 190,54" fill="#0f6e6a"/>' +
    '<polygon points="180,210 170,192 190,192" fill="#6e4b3a"/>' +
    '<polygon points="304,120 286,110 286,130" fill="#c05622"/>' +
    '<polygon points="56,120 74,110 74,130" fill="#9d4034"/>' +
    "</g>"
  );
}

function near(value, target) {
  return Number.isFinite(value) && Math.abs(value - target) <= Math.max(0.05, Math.abs(target) * 0.02);
}

function parseNum(text) {
  return parseFloat(String(text).trim().replace(",", "."));
}

function mountFormative(host, item, onSolved) {
  if (store.flag(item.key)) {
    host.append(el("p", { class: "feedback is-right" }, "Already settled. " + item.why));
    onSolved();
    return;
  }
  const buttons = [];
  let tries = 0;
  const fb = el("p", { class: "feedback", "aria-live": "polite" });
  host.append(el("h3", { class: "prompt" }, item.q));
  item.choices.forEach((text, index) => {
    const button = el("button", { class: "choice", type: "button" }, letter(index), el("span", {}, text));
    button.addEventListener("click", () => {
      if (store.flag(item.key)) return;
      const ok = index === item.answer;
      buttons.forEach((btn) => btn.classList.remove("is-wrong", "is-right"));
      if (ok) {
        button.classList.add("is-right");
        buttons.forEach((btn) => { btn.disabled = true; });
        fb.className = "feedback is-right";
        fb.textContent = "Correct. " + item.why;
        store.setFlag(item.key);
        sfx.ok();
        announce(fb.textContent);
        onSolved();
        return;
      }
      tries += 1;
      sfx.bad();
      button.classList.add("is-wrong");
      fb.className = "feedback is-wrong";
      fb.textContent = tries >= 2 ? item.why : item.hint;
      if (tries >= 3) {
        buttons[item.answer].classList.add("is-right");
      }
      announce(fb.textContent);
    });
    buttons.push(button);
    host.append(button);
  });
  host.append(fb);
}

function mountQuiz(host, items, need, onRecord) {
  const box = el("div");
  const top = el("div", { class: "q-top" });
  host.append(el("p", { class: "quiet" }, "Pass mark: " + need + " of " + items.length + ". One try on each question. You can replay the set."), top, box);
  let index = 0;
  let score = 0;

  function show() {
    top.textContent = index < items.length ? "Question " + (index + 1) + " of " + items.length : "Result";
    box.replaceChildren();
    if (index >= items.length) {
      const passed = score >= need;
      onRecord(score, items.length, passed);
      box.append(el("h3", {}, score + " of " + items.length));
      box.append(el("p", {}, passed ? "Pass mark reached. This check is complete." : "Not at the pass mark yet. Read the notes, then replay."));
      const again = el("button", { class: "btn btn--ghost", type: "button" }, "Replay quiz");
      again.addEventListener("click", () => { index = 0; score = 0; show(); });
      box.append(again);
      return;
    }
    const item = items[index];
    let locked = false;
    const fb = el("p", { class: "feedback", "aria-live": "polite" });
    box.append(el("h3", { class: "prompt" }, item.q));
    const buttons = item.choices.map((text, choice) => {
      const button = el("button", { class: "choice", type: "button" }, letter(choice), el("span", {}, text));
      button.addEventListener("click", () => {
        if (locked) return;
        locked = true;
        const ok = choice === item.answer;
        if (ok) { score += 1; sfx.ok(); }
        else sfx.bad();
        buttons.forEach((btn, j) => {
          btn.disabled = true;
          if (j === item.answer) btn.classList.add("is-right");
          else if (j === choice) btn.classList.add("is-wrong");
        });
        fb.className = "feedback " + (ok ? "is-right" : "is-wrong");
        fb.textContent = (ok ? "Correct. " : "Not quite. ") + item.why;
        const next = el("button", { class: "btn", type: "button" }, index === items.length - 1 ? "See score" : "Next question");
        next.addEventListener("click", () => { index += 1; show(); });
        box.append(next);
        announce(fb.textContent);
      });
      return button;
    });
    buttons.forEach((button) => box.append(button));
    box.append(fb);
  }
  show();
}

function numberFeedback(problem, value, tries) {
  if (!Number.isFinite(value)) return "Type a number first, then press Check.";
  const shown = value + (problem.unit ? " " + problem.unit : "");
  const mistake = (problem.mistakes || []).find((item) => near(value, item.value));
  let why;
  if (mistake) why = mistake.msg;
  else if (value < 0) why = "A negative number means the opposite direction. Use the sizes of the quantities here.";
  else why = shown + " is too " + (value > problem.answer ? "high" : "low") + ". " + (problem.hint || "Check the relation, then try again.");
  if (tries < 3) return "Not quite: " + why;
  return "Not quite: " + why + " Here is the full working: " + (problem.explain || problem.why);
}

function fbdAskProblem(model, key) {
  const ask = Object.assign({}, model.ask, { key: key });
  if (!ask.setup && model.situation) {
    ask.setup = model.situation
      .replace(/\s*What is [^.?]+\?\s*/gi, " ")
      .replace(/\s*Draw the (free[- ]body )?diagram first\.?\s*/gi, " ")
      .replace(/\s*then find [^.?]+\.\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return ask;
}

function mountNumber(host, problem, onSolved) {
  if (store.flag(problem.key)) {
    if (problem.setup) host.append(el("p", { class: "fbd-ask-setup" }, problem.setup));
    host.append(el("p", { class: "feedback is-right" }, "Solved: " + problem.answer + " " + problem.unit + ". " + problem.why));
    onSolved();
    return;
  }
  let tries = 0;
  const input = el("input", { type: "number", step: "any", inputmode: "decimal", "aria-label": problem.unit || "answer" });
  const fb = el("p", { class: "feedback", "aria-live": "polite" });
  const form = el("form", { class: "answer-form" });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = parseNum(input.value);
    if (!near(value, problem.answer)) {
      if (Number.isFinite(value)) tries += 1;
      fb.className = "feedback is-wrong";
      fb.textContent = numberFeedback(problem, value, tries);
      sfx.bad();
      announce(fb.textContent);
      return;
    }
    let dirOk = true;
    if (problem.dir) dirOk = form.querySelector("input[name='dir']:checked")?.value === problem.dir;
    if (!dirOk) {
      fb.className = "feedback is-wrong";
      fb.textContent = "Magnitude is right. Choose the direction of that result.";
      sfx.bad();
      return;
    }
    fb.className = "feedback is-right";
    fb.textContent = "Correct. " + problem.why;
    input.disabled = true;
    sfx.ok();
    store.setFlag(problem.key);
    announce(fb.textContent);
    onSolved();
  });
  if (problem.setup) form.append(el("p", { class: "fbd-ask-setup" }, problem.setup));
  form.append(el("h3", { class: "prompt" }, problem.q));
  if (problem.dir) {
    const dirs = el("div", { class: "dir-row" });
    DIRS.forEach(([id, glyph, name]) => {
      const label = el("label", { class: "dir-btn" });
      const radio = el("input", { type: "radio", name: "dir", value: id });
      radio.addEventListener("change", () => {
        dirs.querySelectorAll(".dir-btn").forEach((node) => node.classList.remove("is-on"));
        label.classList.add("is-on");
      });
      label.append(radio, el("b", { "aria-hidden": "true" }, glyph), el("span", {}, name));
      dirs.append(label);
    });
    form.append(el("p", { class: "quiet" }, "Direction"), dirs);
  }
  form.append(el("div", { class: "field" }, input, el("span", { class: "unit" }, problem.unit)), el("button", { class: "btn", type: "submit" }, "Check"), fb);
  const skipAsk = adminSkipButton("Skip this question", () => {
    store.setFlag(problem.key);
    onSolved();
  });
  if (skipAsk) form.append(el("div", { class: "btn-row admin-skip-row" }, skipAsk));
  host.append(form);
}

function mountProblemSet(host, problems, onProgress) {
  function report() {
    const solved = problems.filter((problem) => store.flag(problem.key)).length;
    onProgress(solved === problems.length ? 1 : solved / problems.length);
  }
  problems.forEach((problem) => {
    const box = cardShell();
    mountNumber(box, problem, report);
    host.append(box);
  });
  report();
}

const SVG_NS = "http://www.w3.org/2000/svg";
const DIR_VEC = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
const FBD_VIEW = { w: 600, h: 340 };
const FBD_LEN = { min: 36, max: 180, start: 90 };
const MAG_BASE = 36;
const MAG_SPAN = 140;
const MAG_MAX_N = 220;

function normDeg(d) {
  return ((d % 360) + 360) % 360;
}
function angDiff(a, b) {
  const d = Math.abs(normDeg(a) - normDeg(b));
  return d > 180 ? 360 - d : d;
}
function angleOfDir(dir) {
  return { right: 0, up: 90, left: 180, down: 270 }[dir] || 0;
}
function expectedAngle(id, model) {
  const spec = model.forces.find((f) => f.id === id);
  if (!spec) return null;
  return spec.angle != null ? spec.angle : angleOfDir(spec.dir);
}
function draftAngle(draft, id) {
  if (draft.angles && draft.angles[id] != null) return draft.angles[id];
  return angleOfDir(draft.dirs[id]);
}
function lenToNewton(len) {
  const t = Math.max(0, Math.min(1, (len - MAG_BASE) / MAG_SPAN));
  return Math.round(t * t * MAG_MAX_N);
}
function drawFbdAxes(guide, C, model) {
  const axisStroke = { stroke: "#1d4ed8", "stroke-width": 1.5, "stroke-dasharray": "4 4", opacity: 0.55 };
  if (model.angle != null) {
    const [ux, uy] = unitFromAngle(model.angle);
    const [nx, ny] = unitFromAngle(model.angle + 90);
    const L = 100;
    guide.append(
      svgNode("line", Object.assign({ x1: C.x - ux * L, y1: C.y - uy * L, x2: C.x + ux * L, y2: C.y + uy * L }, axisStroke)),
      svgNode("line", Object.assign({ x1: C.x - nx * L, y1: C.y - ny * L, x2: C.x + nx * L, y2: C.y + ny * L }, axisStroke)),
      svgNode("text", { class: "fbd-tag", x: C.x + ux * (L + 18) - nx * 16, y: C.y + uy * (L + 18) - ny * 16 }, "x"),
      svgNode("text", { class: "fbd-tag", x: C.x + nx * (L + 18) - ux * 16, y: C.y + ny * (L + 18) - uy * 16 }, "y")
    );
    return;
  }
  guide.append(
    svgNode("line", Object.assign({ x1: C.x - 120, y1: C.y, x2: C.x + 120, y2: C.y }, axisStroke)),
    svgNode("line", Object.assign({ x1: C.x, y1: C.y - 110, x2: C.x, y2: C.y + 110 }, axisStroke)),
    svgNode("text", { class: "fbd-tag", x: C.x + 128, y: C.y + 18 }, "x"),
    svgNode("text", { class: "fbd-tag", x: C.x - 14, y: C.y - 118, "text-anchor": "end" }, "y")
  );
}
function magTolerance(expected) {
  return Math.max(4, expected * 0.1);
}
function snapDeg(deg, model) {
  const base = model.angle == null ? [0, 90, 180, 270] : [0, 90, 180, 270, model.angle, model.angle + 90, model.angle + 180, model.angle + 270];
  let best = normDeg(base[0]);
  let bestDiff = 999;
  base.forEach((opt) => {
    const diff = angDiff(deg, opt);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = normDeg(opt);
    }
  });
  return best;
}
function dirFromAngle(angle) {
  const a = normDeg(angle);
  if (a >= 45 && a < 135) return "up";
  if (a >= 135 && a < 225) return "left";
  if (a >= 225 && a < 315) return "down";
  return "right";
}
function unitFromAngle(angle) {
  const r = normDeg(angle) * Math.PI / 180;
  return [Math.cos(r), -Math.sin(r)];
}

const FORCE_NEED = {
  gravity: "Earth pulls on every object that has mass, so gravity is always on the diagram.",
  normal: "The surface it rests on pushes back on it.",
  applied: "Something is pushing it, so that push belongs on the diagram.",
  friction: "A rough surface resists the sliding.",
  tension: "A rope or cord is pulling on it.",
  drag: "Air is pushing against the motion.",
  motion: ""
};
const FORCE_AIM = {
  gravity: "Gravity always points straight down, toward Earth.",
  normal: "The normal force points away from the surface, here straight up.",
  applied: "The applied force points the way the push goes.",
  friction: "Friction points opposite the motion, against the push.",
  tension: "Tension pulls along the rope, away from the object.",
  drag: "Drag points against the motion, the way the air pushes.",
  motion: ""
};
const FORCE_NOT = {
  gravity: "",
  normal: "Nothing solid is under it to push back.",
  applied: "Nothing is pushing or pulling it.",
  friction: "Nothing is sliding or trying to slide, so there is no friction.",
  tension: "No rope or cord is attached to it.",
  drag: "Nothing in the problem is pushing with air.",
  motion: "“Force of motion” is not a real force. A moving object keeps moving without one."
};

function svgNode(tag, attrs, text) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs || {}).forEach((key) => node.setAttribute(key, attrs[key]));
  if (text != null) node.textContent = text;
  return node;
}

function arrowIsCorrect(model, draft, id) {
  if (!draft.forces.has(id)) return false;
  const spec = model.forces.find((f) => f.id === id);
  if (!spec) return false;
  const want = spec.angle != null ? spec.angle : angleOfDir(spec.dir);
  if (angDiff(draftAngle(draft, id), want) > 18) return false;
  if (spec.mag != null) {
    const actual = lenToNewton(draft.lens[id] || 0);
    if (Math.abs(actual - spec.mag) > magTolerance(spec.mag)) return false;
  }
  return true;
}

function gradeFbd(model, draft) {
  const messages = [];
  const off = new Set();
  const name = model.object.toLowerCase();
  if (draft.object !== model.object) messages.push("A free-body diagram isolates one object. Tap the " + name + " in the scene first.");
  model.forces.forEach((force) => {
    if (!draft.forces.has(force.id)) messages.push("Missing " + FORCE[force.id].label.toLowerCase() + ". " + FORCE_NEED[force.id]);
  });
  draft.forces.forEach((id) => {
    if (model.forces.some((force) => force.id === id)) return;
    off.add(id);
    messages.push(FORCE[id].label + " does not act on the " + name + " here. " + FORCE_NOT[id]);
  });
  model.forces.forEach((force) => {
    if (!draft.forces.has(force.id)) return;
    const want = force.angle != null ? force.angle : angleOfDir(force.dir);
    if (angDiff(draftAngle(draft, force.id), want) <= 18) return;
    off.add(force.id);
    messages.push(FORCE[force.id].label + " points the wrong way.");
  });
  const aimed = (id) => draft.forces.has(id) && !off.has(id);
  const len = (id) => draft.lens[id] || 0;
  (model.eq || []).forEach(([a, b]) => {
    if (!aimed(a) || !aimed(b)) return;
    const ratio = len(a) / len(b);
    if (ratio > 0.82 && ratio < 1.22) return;
    messages.push(FORCE[a].label + " and " + FORCE[b].label.toLowerCase() + " balance here: the " + name + " neither sinks into the surface nor lifts off it. Make those two arrows the same length.");
  });
  (model.gt || []).forEach(([a, b, why]) => {
    if (!aimed(a) || !aimed(b) || len(a) > len(b) * 1.15) return;
    messages.push(FORCE[a].label + " is bigger than " + FORCE[b].label.toLowerCase() + (why ? " (" + why + ")" : "") + ", so its arrow should be clearly longer.");
  });
  model.forces.forEach((force) => {
    if (force.mag == null || !aimed(force.id)) return;
    const expected = force.mag;
    const actual = lenToNewton(len(force.id));
    if (Math.abs(actual - expected) <= magTolerance(expected)) return;
    off.add(force.id);
    messages.push(FORCE[force.id].label + " is " + (actual > expected ? "too long" : "too short") + ". Drag the arrow until the number matches the problem.");
  });
  return { ok: messages.length === 0, messages: messages, off: off };
}

function arrowLabelText(model, draft, id) {
  return FORCE[id].symbol + "  " + lenToNewton(draft.lens[id] || FBD_LEN.start) + " N";
}

function arrowLabelPoint(ex, ey, vx, vy, view) {
  const along = 24;
  let lx = ex + vx * along;
  let ly = ey + vy * along;
  if (vy > 0) ly += 10;
  else if (vy < 0) ly -= 8;
  else ly += 6;
  if (vx !== 0) lx += vx * 8;

  const minX = view.x + 18;
  const maxX = view.x + view.w - 18;
  const minY = view.y + 20;
  const maxY = view.y + view.h - 10;
  return {
    lx: Math.min(maxX, Math.max(minX, lx)),
    ly: Math.min(maxY, Math.max(minY, ly))
  };
}

function expectedDir(id, model) {
  const spec = model.forces.find((f) => f.id === id);
  return spec ? spec.dir : null;
}

function fbdFraction(model, draft) {
  if (gradeFbd(model, draft).ok) return 1;
  let score = 0;
  if (draft.object === model.object) score += 0.2;
  const ids = model.forces.map((force) => force.id);
  const exact = ids.every((id) => draft.forces.has(id)) && draft.forces.size === ids.length;
  if (exact) score += 0.3;
  if (exact && model.forces.every((force) => {
    const want = force.angle != null ? force.angle : angleOfDir(force.dir);
    return angDiff(draftAngle(draft, force.id), want) <= 18;
  })) score += 0.3;
  return Math.min(score, 0.95);
}

function buildFbdScene(layer, model) {
  const parts = {};
  const has = (name) => model.objects.includes(name);
  const ground = has("Table") ? 300 : 190;

  function part(name) {
    const g = svgNode("g", { class: "fbd-part", tabindex: "0", role: "button", "aria-label": name, "data-part": name });
    parts[name] = g;
    layer.append(g);
    return g;
  }
  function tag(g, x, y, text, anchor) {
    g.append(svgNode("text", { class: "fbd-tag", x: x, y: y, "text-anchor": anchor || "start" }, text));
  }

  if (has("Earth")) {
    const g = part("Earth");
    g.append(
      svgNode("circle", { class: "fbd-shape", cx: 546, cy: 64, r: 34, fill: "#cfe3dc", stroke: "#1c2a24", "stroke-width": 2 }),
      svgNode("ellipse", { cx: 546, cy: 64, rx: 14, ry: 34, fill: "none", stroke: "#0f6e6a", "stroke-width": 1.5, opacity: 0.6 }),
      svgNode("line", { x1: 512, y1: 64, x2: 580, y2: 64, stroke: "#0f6e6a", "stroke-width": 1.5, opacity: 0.6 })
    );
    tag(g, 546, 116, "Earth", "middle");
  }
  if (has("Floor")) {
    const g = part("Floor");
    g.append(svgNode("rect", { class: "fbd-shape", x: 0, y: ground, width: FBD_VIEW.w, height: FBD_VIEW.h - ground, fill: "#e7ddcc" }));
    g.append(svgNode("line", { x1: 0, y1: ground, x2: FBD_VIEW.w, y2: ground, stroke: "#1c2a24", "stroke-width": 3 }));
    for (let x = 14; x < FBD_VIEW.w + 14; x += 18) {
      g.append(svgNode("line", { x1: x, y1: ground, x2: x - 12, y2: ground + 12, stroke: "#1c2a24", "stroke-width": 1.5, opacity: 0.45 }));
    }
    tag(g, 20, ground + 34, "Floor");
  }
  if (has("Table")) {
    const g = part("Table");
    g.append(
      svgNode("rect", { class: "fbd-shape", x: 150, y: 190, width: 300, height: 13, rx: 3, fill: "#c9a77c", stroke: "#1c2a24", "stroke-width": 2 }),
      svgNode("rect", { x: 172, y: 203, width: 12, height: 97, fill: "#b38f63", stroke: "#1c2a24", "stroke-width": 2 }),
      svgNode("rect", { x: 416, y: 203, width: 12, height: 97, fill: "#b38f63", stroke: "#1c2a24", "stroke-width": 2 })
    );
    tag(g, 462, 222, "Table");
  }
  if (has("Person")) {
    const g = part("Person");
    const limb = { stroke: "#1c2a24", "stroke-width": 5, "stroke-linecap": "round", fill: "none" };
    g.append(
      svgNode("circle", { class: "fbd-shape", cx: 172, cy: 74, r: 14, fill: "#e7b991", stroke: "#1c2a24", "stroke-width": 2.5 }),
      svgNode("line", Object.assign({ x1: 178, y1: 89, x2: 196, y2: 142 }, limb)),
      svgNode("line", Object.assign({ x1: 196, y1: 142, x2: 176, y2: 190 }, limb)),
      svgNode("line", Object.assign({ x1: 196, y1: 142, x2: 220, y2: 190 }, limb)),
      svgNode("line", Object.assign({ x1: 184, y1: 104, x2: 256, y2: 156 }, limb)),
      svgNode("line", Object.assign({ x1: 186, y1: 110, x2: 256, y2: 170 }, limb))
    );
    tag(g, 118, 52, "Person");
  }
  if (has("Hand")) {
    const g = part("Hand");
    g.append(
      svgNode("rect", { class: "fbd-shape", x: 96, y: 155, width: 136, height: 20, rx: 10, fill: "#31457a", stroke: "#1c2a24", "stroke-width": 2 }),
      svgNode("ellipse", { cx: 242, cy: 165, rx: 18, ry: 14, fill: "#e7b991", stroke: "#1c2a24", "stroke-width": 2 })
    );
    tag(g, 100, 144, "Hand");
  }

  const g = part(model.object);
  if (model.object === "Book") {
    g.append(
      svgNode("rect", { class: "fbd-cut", x: 241, y: 147, width: 118, height: 56, rx: 10 }),
      svgNode("rect", { class: "fbd-shape", x: 255, y: 160, width: 90, height: 30, rx: 4, fill: "#9d4034", stroke: "#1c2a24", "stroke-width": 3 }),
      svgNode("rect", { x: 262, y: 166, width: 76, height: 7, rx: 2, fill: "#fffaf3", opacity: 0.85 })
    );
    tag(g, 300, 186, "BOOK", "middle");
  } else {
    g.append(
      svgNode("rect", { class: "fbd-cut", x: 246, y: 127, width: 108, height: 76, rx: 12 }),
      svgNode("rect", { class: "fbd-shape", x: 260, y: 140, width: 80, height: 50, rx: 6, fill: "#fffaf3", stroke: "#1c2a24", "stroke-width": 3 }),
      svgNode("line", { x1: 260, y1: 157, x2: 340, y2: 157, stroke: "#1c2a24", opacity: 0.25 }),
      svgNode("line", { x1: 260, y1: 173, x2: 340, y2: 173, stroke: "#1c2a24", opacity: 0.25 })
    );
    tag(g, 300, 186, model.object.toUpperCase(), "middle");
  }
  g.classList.add("is-target");
  return { parts: parts, center: { x: 300, y: model.object === "Book" ? 175 : 165 } };
}

function buildSimpleScene(layer, model) {
  if (model.air) {
    const cx = 300;
    const cy = 156;
    layer.append(svgNode("rect", { x: cx - 42, y: cy - 26, width: 84, height: 52, rx: 6, fill: "#ffffff", stroke: "#1c2433", "stroke-width": 3 }));
    return { parts: {}, center: { x: cx, y: cy } };
  }
  if (model.angle != null) {
    const ang = model.angle * Math.PI / 180;
    const x0 = 118;
    const y0 = 300;
    const run = 340;
    const rise = run * Math.tan(ang);
    const x1 = x0 + run;
    const y1 = y0 - rise;
    const t = 0.46;
    const sx = x0 + run * t;
    const sy = y0 - rise * t;
    const [nx, ny] = unitFromAngle(model.angle + 90);
    const cx = sx + nx * 22;
    const cy = sy + ny * 22;
    layer.append(
      svgNode("polygon", {
        points: x0 + "," + y0 + " " + x1 + "," + y0 + " " + x1 + "," + y1,
        fill: "#e7eef8",
        stroke: "#1c2433",
        "stroke-width": 3
      }),
      svgNode("text", { class: "fbd-tag", x: x1 - 42, y: y0 - 10 }, model.angle + "°")
    );
    const g = svgNode("g", { transform: "rotate(" + (-model.angle) + " " + cx + " " + cy + ")" });
    g.append(svgNode("rect", { x: cx - 36, y: cy - 22, width: 72, height: 40, rx: 6, fill: "#ffffff", stroke: "#1c2433", "stroke-width": 3 }));
    layer.append(g);
    return { parts: {}, center: { x: cx, y: cy } };
  }
  const cx = 300;
  const cy = model.hanging ? 178 : 156;
  if (model.hanging) {
    layer.append(svgNode("line", { x1: cx, y1: 36, x2: cx, y2: cy - 28, stroke: "#1c2433", "stroke-width": 3 }));
  } else {
    layer.append(svgNode("line", { x1: 80, y1: 228, x2: 520, y2: 228, stroke: "#1c2433", "stroke-width": 3 }));
  }
  layer.append(svgNode("rect", { x: cx - 42, y: cy - 26, width: 84, height: 52, rx: 6, fill: "#ffffff", stroke: "#1c2433", "stroke-width": 3 }));
  return { parts: {}, center: { x: cx, y: cy } };
}

function blockFbdPageScroll(event) {
  event.preventDefault();
}

function setFbdDragging(on) {
  document.body.classList.toggle("is-fbd-dragging", !!on);
  if (on) document.addEventListener("touchmove", blockFbdPageScroll, { passive: false, capture: true });
  else document.removeEventListener("touchmove", blockFbdPageScroll, { capture: true });
}

function mountFbd(host, model, onProgress, opts) {
  opts = opts || {};
  const draft = { object: null, forces: new Set(), dirs: {}, lens: {}, angles: {} };
  const objectName = model.object.toLowerCase();
  let solved = false;
  let drag = null;
  let dragMoved = false;
  let lastTap = { id: null, at: 0 };
  let touched = false;
  let fresh = null;
  let refocus = null;
  let activeForce = null;
  let flagged = new Set();
  let shakeOnce = new Set();
  let heardOk = new Set();
  let note = "";

  const compactCanvas = window.matchMedia("(max-width: 720px)").matches && !opts.simple;
  const canvasView = compactCanvas ? { x: 95, y: 22, w: 410, h: 278 } : { x: 0, y: 0, w: FBD_VIEW.w, h: FBD_VIEW.h };
  const svg = svgNode("svg", {
    viewBox: canvasView.x + " " + canvasView.y + " " + canvasView.w + " " + canvasView.h,
    class: "fbd-svg",
    role: "group",
    "aria-label": "Free-body diagram canvas"
  });
  const sceneLayer = svgNode("g", { class: "fbd-scene" });
  const guide = svgNode("g", { class: "fbd-guide", "aria-hidden": "true" });
  const arrowLayer = svgNode("g", { class: "fbd-arrows" });
  svg.append(sceneLayer, guide, arrowLayer);
  const scene = opts.simple ? buildSimpleScene(sceneLayer, model) : buildFbdScene(sceneLayer, model);
  const C = scene.center;
  if (opts.simple) {
    draft.object = model.object;
    svg.classList.add("is-isolated");
  }

  if (opts.showAxes) drawFbdAxes(guide, C, model);
  const tip = el("p", { class: "fbd-tip", "aria-live": "polite" });
  const coachStep = el("strong", { class: "fbd-coach__step" });
  const coach = el("div", { class: "fbd-coach", role: "status" }, coachStep, tip);
  const stage = el("div", { class: "stage fbd-stage" }, svg);

  const stepNames = ["Isolate", "Add forces", "Aim & size", "Check"];
  const steps = el("ol", { class: "fbd-steps" }, stepNames.map((name) => el("li", {}, el("span", {}, name))));

  const tray = el("div", { class: "fbd-tray" });
  const chips = {};
  const trayIds = opts.trayIds || (opts.rejectExtra
    ? [...new Set(model.forces.map((f) => f.id))]
    : model.catalog.filter((id) => id !== "motion"));
  trayIds.forEach((id) => {
    const chip = el("button", { class: "fbd-chip", type: "button", "aria-pressed": "false" },
      el("i", { class: "fbd-chip__glyph", "aria-hidden": "true" }),
      el("span", {}, FORCE[id].label),
      el("small", {}, FORCE[id].symbol)
    );
    chip.style.setProperty("--c", FORCE[id].color);
    wireChip(chip, id);
    chips[id] = chip;
    tray.append(chip);
  });

  const feedback = el("div", { class: "feedback fbd-feedback", "aria-live": "polite" });
  const check = el("button", { class: "btn", type: "button" }, "Check diagram");
  const clear = el("button", { class: "btn btn--ghost", type: "button" }, "Clear arrows");

  if (opts.hideSteps) steps.hidden = true;
  if (opts.hideCoach) coach.hidden = true;
  const shell = el("div", { class: "fbd" + (opts.focusCanvas ? " is-focus" : "") + (compactCanvas ? " is-compact" : "") },
    el("div", { class: "fbd-workbench" }, stage),
    el("div", { class: "fbd-side" },
      el("p", { class: "kicker" }, "Forces"),
      tray
    )
  );
  function setDiagramDone(on) {
    mount.classList.toggle("is-diagram-done", on);
    shell.classList.toggle("is-diagram-done", on);
  }

  const mount = el("div", { class: "fbd-mount" + (compactCanvas ? " is-compact" : "") });
  if (!opts.hideSituation) mount.append(el("p", { class: "fbd-situation" }, model.situation));
  mount.append(steps, coach, shell, el("div", { class: "btn-row fbd-actions" }, check, clear), feedback);
  host.append(mount);

  function isolated() { return draft.object === model.object; }

  function resizeActive(amount) {
    if (!activeForce || solved) return;
    draft.lens[activeForce] = Math.max(FBD_LEN.min, Math.min(FBD_LEN.max, draft.lens[activeForce] + amount));
    touched = true;
    judgeArrow(activeForce);
    edited();
  }

  function toSvg(event) {
    const box = svg.getBoundingClientRect();
    return {
      x: canvasView.x + (event.clientX - box.left) * canvasView.w / box.width,
      y: canvasView.y + (event.clientY - box.top) * canvasView.h / box.height
    };
  }

  function aimFrom(point) {
    const dx = point.x - C.x;
    const dy = point.y - C.y;
    const raw = Math.atan2(-dy, dx) * 180 / Math.PI;
    const angle = snapDeg(raw, model);
    const len = Math.max(FBD_LEN.min, Math.min(FBD_LEN.max, Math.hypot(dx, dy)));
    return { dir: dirFromAngle(angle), angle: angle, len: len, near: Math.hypot(dx, dy) };
  }

  function requiredForceIds() {
    return model.forces.map((f) => f.id);
  }

  function hasAllForces() {
    return requiredForceIds().every((id) => draft.forces.has(id));
  }

  function forcesSetMatch() {
    const req = requiredForceIds();
    return req.length === draft.forces.size && req.every((id) => draft.forces.has(id));
  }

  function diagramComplete() {
    return gradeFbd(model, draft).ok;
  }

  function syncArrowFlags() {
    if (solved) return;
    flagged = new Set(gradeFbd(model, draft).off);
  }

  function nudge(text) {
    tip.textContent = text;
    stage.classList.remove("is-nudge");
    void stage.offsetWidth;
    stage.classList.add("is-nudge");
  }

  function choose(name) {
    if (solved || isolated()) return;
    draft.object = name;
    if (name === model.object) {
      svg.classList.add("is-isolated");
      scene.parts[name].classList.add("is-object");
      feedback.className = "feedback fbd-feedback";
      feedback.textContent = "";
      announce("The " + objectName + " is cut free from its surroundings. Now add the forces on it.");
    } else {
      const g = scene.parts[name];
      g.classList.remove("is-wrongpick");
      void g.getBoundingClientRect();
      g.classList.add("is-wrongpick");
      feedback.className = "feedback fbd-feedback is-wrong";
      feedback.textContent = "The " + name.toLowerCase() + " is part of the surroundings. It pushes or pulls on the object, but it is not the object this question is about. Read the situation again.";
      feedbackWrong();
      announce(feedback.textContent);
    }
    edited(true);
  }

  Object.keys(scene.parts).forEach((name) => {
    const g = scene.parts[name];
    g.addEventListener("click", () => choose(name));
    g.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose(name);
      }
    });
  });

  function flyGhostHome(id, chipEl, x, y) {
    if (!chipEl || x == null || y == null) return;
    const ghostEl = el("div", { class: "fbd-ghost" }, FORCE[id].symbol);
    ghostEl.style.setProperty("--c", FORCE[id].color);
    ghostEl.style.left = x + "px";
    ghostEl.style.top = y + "px";
    document.body.append(ghostEl);
    const dest = chipEl.getBoundingClientRect();
    requestAnimationFrame(() => {
      ghostEl.classList.add("is-return");
      ghostEl.style.left = (dest.left + dest.width / 2) + "px";
      ghostEl.style.top = (dest.top + dest.height / 2) + "px";
    });
    window.setTimeout(() => ghostEl.remove(), 420);
  }

  function rejectForce(id, chipEl, origin) {
    if (chipEl) {
      chipEl.classList.remove("is-reject");
      void chipEl.offsetWidth;
      chipEl.classList.add("is-reject");
    }
    if (origin) flyGhostHome(id, chipEl, origin.x, origin.y);
    feedbackWrong();
    note = FORCE[id].label + " is not acting on the " + objectName + " in this problem. Remove it or pick a different force.";
    paint();
  }

  function addForce(id, aim, chipEl, origin) {
    if (solved) return;
    if (!isolated()) {
      nudge("Isolate first: tap the " + objectName + " in the scene.");
      return;
    }
    if (opts.rejectExtra && !model.forces.some((f) => f.id === id)) {
      rejectForce(id, chipEl, origin);
      return;
    }
    draft.forces.add(id);
    draft.angles[id] = aim ? aim.angle : 0;
    draft.dirs[id] = aim ? aim.dir : "right";
    draft.lens[id] = aim ? aim.len : FBD_LEN.start;
    activeForce = id;
    fresh = id;
    judgeArrow(id);
    edited();
  }

  function judgeArrow(id) {
    if (solved || !draft.forces.has(id)) return;
    const wasOff = flagged.has(id);
    const want = expectedAngle(id, model);
    if (want != null && angDiff(draft.angles[id], want) > 18) {
      if (!wasOff) {
        shakeOnce.add(id);
        heardOk.delete(id);
        sfx.bad();
      }
      flagged.add(id);
      note = FORCE[id].label + " points the wrong way. Drag the arrow until it matches the situation.";
      return;
    }
    const spec = model.forces.find((f) => f.id === id);
    if (spec && spec.mag != null) {
      const actual = lenToNewton(draft.lens[id]);
      if (Math.abs(actual - spec.mag) > magTolerance(spec.mag)) {
        if (!wasOff) {
          shakeOnce.add(id);
          heardOk.delete(id);
          sfx.bad();
        }
        flagged.add(id);
        note = FORCE[id].label + " is " + (actual > spec.mag ? "too long" : "too short") + ". The number on the arrow is the force in newtons.";
        return;
      }
    }
    flagged.delete(id);
    if (wasOff || !heardOk.has(id)) {
      heardOk.add(id);
      sfx.ok();
    }
    note = FORCE[id].label + " looks correct and stays on the " + objectName + ".";
    const pair = (model.eq || []).find((pair) => pair[0] === id || pair[1] === id);
    if (pair) {
      const other = pair[0] === id ? pair[1] : pair[0];
      if (draft.forces.has(other) && arrowIsCorrect(model, draft, other)) {
        const ratio = (draft.lens[id] || 0) / (draft.lens[other] || 1);
        if (ratio <= 0.82 || ratio >= 1.22) {
          note = FORCE[id].label + " points the right way. Match its length to " + FORCE[other].label.toLowerCase() + " so the two balance.";
        }
      }
    }
    if (diagramComplete()) note = "Every force looks correct. Tap Check diagram to finish.";
  }

  function removeForce(id) {
    if (solved) return;
    draft.forces.delete(id);
    delete draft.dirs[id];
    delete draft.lens[id];
    delete draft.angles[id];
    if (activeForce === id) activeForce = null;
    note = "";
    edited();
  }

  function wireChip(chip, id) {
    chip.style.touchAction = "none";
    let ghost = null;
    let moved = false;
    let start = null;
    chip.addEventListener("pointerdown", (event) => {
      if (solved) return;
      moved = false;
      start = { x: event.clientX, y: event.clientY };
      chip.setPointerCapture(event.pointerId);
    });
    chip.addEventListener("pointermove", (event) => {
      if (!start) return;
      if (!moved && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) {
        moved = true;
        ghost = el("div", { class: "fbd-ghost" }, FORCE[id].symbol);
        ghost.style.setProperty("--c", FORCE[id].color);
        document.body.append(ghost);
        stage.classList.add("is-drop");
      }
      if (ghost) {
        ghost.style.left = event.clientX + "px";
        ghost.style.top = event.clientY + "px";
      }
    });
    function finish(event, cancelled) {
      if (!start) return;
      start = null;
      stage.classList.remove("is-drop");
      if (ghost) ghost.remove();
      ghost = null;
      if (cancelled) return;
      const origin = moved ? { x: event.clientX, y: event.clientY } : null;
      if (!moved) {
        if (draft.forces.has(id)) removeForce(id);
        else addForce(id, null, chip, origin);
        return;
      }
      const box = svg.getBoundingClientRect();
      const inside = event.clientX >= box.left && event.clientX <= box.right
        && event.clientY >= box.top && event.clientY <= box.bottom;
      if (!inside) {
        if (opts.rejectExtra && !model.forces.some((f) => f.id === id)) rejectForce(id, chip, origin);
        return;
      }
      const aim = aimFrom(toSvg(event));
      if (aim.near < 30) {
        aim.angle = 0;
        aim.dir = "right";
        aim.len = FBD_LEN.start;
      }
      touched = touched || aim.near >= 30;
      addForce(id, aim, chip, origin);
    }
    chip.addEventListener("pointerup", (event) => finish(event, false));
    chip.addEventListener("pointercancel", (event) => finish(event, true));
  }

  svg.addEventListener("pointermove", (event) => {
    if (!drag || solved) return;
    event.preventDefault();
    const aim = aimFrom(toSvg(event));
    if (aim.angle === draft.angles[drag] && Math.abs(aim.len - draft.lens[drag]) < 2) return;
    dragMoved = true;
    draft.dirs[drag] = aim.dir;
    draft.angles[drag] = aim.angle;
    draft.lens[drag] = aim.len;
    renderArrows();
  }, { passive: false });
  function endHandleDrag() {
    if (!drag) return;
    const id = drag;
    drag = null;
    svg.classList.remove("is-dragging");
    setFbdDragging(false);
    if (!dragMoved) return;
    lastTap = { id: null, at: 0 };
    touched = true;
    judgeArrow(id);
    edited();
  }

  function beginArrowDrag(id, event) {
    if (solved) return;
    event.preventDefault();
    event.stopPropagation();
    activeForce = id;
    paintChips();
    const now = Date.now();
    if (lastTap.id === id && now - lastTap.at < 350) {
      lastTap = { id: null, at: 0 };
      removeForce(id);
      return;
    }
    lastTap = { id: id, at: now };
    drag = id;
    dragMoved = false;
    fresh = null;
    svg.classList.add("is-dragging");
    setFbdDragging(true);
    try { svg.setPointerCapture(event.pointerId); } catch (err) { /* capture optional */ }
  }

  function wireArrowPointerDrag(target, id) {
    target.style.touchAction = "none";
    target.addEventListener("pointerdown", (event) => beginArrowDrag(id, event));
  }

  function wireArrowKeyboard(target, id) {
    target.addEventListener("keydown", (event) => {
      if (solved) return;
      const turn = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[event.key];
      if (turn) {
        draft.angles[id] = model.angle != null
          ? normDeg({ right: model.angle, left: model.angle + 180, up: model.angle + 90, down: 270 }[turn])
          : angleOfDir(turn);
        draft.dirs[id] = dirFromAngle(draft.angles[id]);
      } else if (event.key === "+" || event.key === "=") draft.lens[id] = Math.min(FBD_LEN.max, draft.lens[id] + 8);
      else if (event.key === "-" || event.key === "_") draft.lens[id] = Math.max(FBD_LEN.min, draft.lens[id] - 8);
      else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeForce(id);
        return;
      } else return;
      event.preventDefault();
      touched = true;
      refocus = id;
      judgeArrow(id);
      edited();
    });
  }
  svg.addEventListener("pointerup", endHandleDrag);
  svg.addEventListener("pointercancel", endHandleDrag);

  const arrowParts = Object.create(null);
  let arrowDot = null;

  function forceGeom(id, ids) {
    const angle = draft.angles[id] == null ? angleOfDir(draft.dirs[id]) : draft.angles[id];
    const [vx, vy] = unitFromAngle(angle);
    const same = ids.filter((other) => {
      const otherAngle = draft.angles[other] == null ? angleOfDir(draft.dirs[other]) : draft.angles[other];
      return angDiff(otherAngle, angle) < 12;
    });
    const shift = same.length < 2 ? 0 : (same.indexOf(id) - (same.length - 1) / 2) * 18;
    const px = -vy;
    const py = vx;
    const len = draft.lens[id];
    const x1 = C.x + px * shift;
    const y1 = C.y + py * shift;
    const ex = x1 + vx * len;
    const ey = y1 + vy * len;
    const labelPt = arrowLabelPoint(ex, ey, vx, vy, canvasView);
    return {
      vx: vx, vy: vy, px: px, py: py, x1: x1, y1: y1, ex: ex, ey: ey,
      color: FORCE[id].color,
      ok: !solved && arrowIsCorrect(model, draft, id),
      lx: labelPt.lx,
      ly: labelPt.ly,
      label: arrowLabelText(model, draft, id)
    };
  }

  function layoutArrow(id, parts, geom, live) {
    const x1 = geom.x1, y1 = geom.y1, ex = geom.ex, ey = geom.ey;
    const vx = geom.vx, vy = geom.vy, px = geom.px, py = geom.py, color = geom.color;
    parts.hit.setAttribute("x1", x1);
    parts.hit.setAttribute("y1", y1);
    parts.hit.setAttribute("x2", ex);
    parts.hit.setAttribute("y2", ey);
    parts.shaft.setAttribute("x1", x1);
    parts.shaft.setAttribute("y1", y1);
    parts.shaft.setAttribute("x2", ex - vx * 14);
    parts.shaft.setAttribute("y2", ey - vy * 14);
    parts.shaft.setAttribute("stroke", color);
    parts.head.setAttribute("points",
      ex + "," + ey + " " + (ex - vx * 20 + px * 10) + "," + (ey - vy * 20 + py * 10) + " " + (ex - vx * 20 - px * 10) + "," + (ey - vy * 20 - py * 10));
    parts.head.setAttribute("fill", color);
    parts.hitRect.setAttribute("x", geom.lx - 70);
    parts.hitRect.setAttribute("y", geom.ly - 16);
    parts.text.setAttribute("x", geom.lx);
    parts.text.setAttribute("y", geom.ly);
    parts.text.setAttribute("fill", color);
    if (parts.text.textContent !== geom.label) parts.text.textContent = geom.label;
    parts.wrap.setAttribute("aria-label", FORCE[id].label + ", " + geom.label + ". Drag to aim and resize. Arrow keys aim, plus and minus resize, Delete removes.");
    if (live) return;
    const wrong = flagged.has(id);
    const cls = "fbd-arrow"
      + (wrong ? " is-off" : "")
      + (shakeOnce.has(id) ? " is-shake" : "")
      + (!wrong && geom.ok ? " is-ok" : "")
      + (fresh === id ? " is-new" : "");
    if (parts.g.getAttribute("class") !== cls) parts.g.setAttribute("class", cls);
    parts.g.style.color = color;
  }

  function makeArrow(id, geom) {
    const g = svgNode("g", { class: "fbd-arrow" });
    g.style.color = geom.color;
    const wrap = svgNode("g", {
      class: "fbd-arrow__label-wrap",
      tabindex: "0",
      role: "slider",
      "data-id": id
    });
    const hitRect = svgNode("rect", { class: "fbd-arrow__label-hit", x: geom.lx - 70, y: geom.ly - 16, width: 140, height: 28, rx: 6, fill: "transparent" });
    const text = svgNode("text", { class: "fbd-arrow__label", x: geom.lx, y: geom.ly, "text-anchor": "middle", fill: geom.color, "pointer-events": "none" }, geom.label);
    wrap.append(hitRect, text);
    const hit = svgNode("line", { class: "fbd-arrow__hit", x1: geom.x1, y1: geom.y1, x2: geom.ex, y2: geom.ey, stroke: "transparent", "stroke-width": 28, "stroke-linecap": "round" });
    const shaft = svgNode("line", { class: "fbd-arrow__shaft", x1: geom.x1, y1: geom.y1, x2: geom.ex, y2: geom.ey, stroke: geom.color, "stroke-width": 6, "stroke-linecap": "round" });
    const head = svgNode("polygon", { class: "fbd-arrow__head", fill: geom.color });
    [hit, shaft, head, wrap].forEach((part) => wireArrowPointerDrag(part, id));
    wireArrowKeyboard(wrap, id);
    g.append(hit, shaft, head, wrap);
    arrowLayer.append(g);
    const parts = { g: g, hit: hit, shaft: shaft, head: head, wrap: wrap, hitRect: hitRect, text: text };
    arrowParts[id] = parts;
    layoutArrow(id, parts, geom, false);
    return parts;
  }

  function renderArrows() {
    const ids = [...draft.forces];
    const live = !!drag;
    Object.keys(arrowParts).forEach((id) => {
      if (!draft.forces.has(id)) {
        arrowParts[id].g.remove();
        delete arrowParts[id];
      }
    });
    ids.forEach((id) => {
      const geom = forceGeom(id, ids);
      if (!arrowParts[id]) makeArrow(id, geom);
      else layoutArrow(id, arrowParts[id], geom, live);
    });
    if (isolated()) {
      if (!arrowDot) {
        arrowDot = svgNode("circle", { class: "fbd-dot", cx: C.x, cy: C.y, r: 5 });
        arrowLayer.append(arrowDot);
      }
    } else if (arrowDot) {
      arrowDot.remove();
      arrowDot = null;
    }
    if (refocus && arrowParts[refocus]) {
      arrowParts[refocus].wrap.focus();
      refocus = null;
    }
    if (!live) shakeOnce.clear();
  }

  function paintSteps() {
    const matched = forcesSetMatch();
    const complete = diagramComplete();
    const done = [isolated(), matched, complete, solved];
    const current = done.indexOf(false);
    [...steps.children].forEach((li, index) => {
      li.classList.toggle("is-done", done[index]);
      li.classList.toggle("is-on", index === (current < 0 ? 3 : current));
    });
    mount.classList.toggle("is-fbd-ready", complete && !solved);
    check.classList.toggle("is-ready", complete && !solved);
    const coachWrong = !solved && !complete && flagged.size > 0
      && ((activeForce && flagged.has(activeForce)) || /too long|too short|wrong way/i.test(note || ""));
    const coachRight = !solved && !complete && !coachWrong && note
      && (/looks correct|Every force looks correct|Tap Check diagram/i.test(note)
        || (activeForce && draft.forces.has(activeForce) && !flagged.has(activeForce) && arrowIsCorrect(model, draft, activeForce)));
    coach.classList.toggle("is-ready", complete && !solved);
    coach.classList.toggle("is-solved", solved);
    coach.classList.toggle("is-wrong", coachWrong);
    coach.classList.toggle("is-right", coachRight);
    coachStep.textContent = solved ? "Correct" : (complete && !solved ? "Ready" : "Step " + ((current < 0 ? 3 : current) + 1) + " of 4");
    if (solved) {
      tip.textContent = "Diagram correct. Every force on the " + objectName + " is drawn, aimed, and sized.";
    } else if (complete) {
      tip.textContent = "Every force looks correct. Tap Check diagram to finish.";
    } else if (note) {
      tip.textContent = note;
    } else if (!isolated()) {
      tip.textContent = "Tap the " + objectName + " in the picture to isolate it.";
    } else if (!matched) {
      tip.textContent = "Drag each force that acts on the " + objectName + " from the tray onto the diagram.";
    } else {
      tip.textContent = "Drag each arrow to aim and size it. Green arrows are correct. Red dashed arrows still need work.";
    }
  }

  function paintChips() {
    tray.classList.toggle("is-locked", !isolated() || solved);
    Object.keys(chips).forEach((id) => {
      const on = draft.forces.has(id);
      chips[id].classList.toggle("is-on", on);
      chips[id].classList.toggle("is-editing", on && activeForce === id);
      chips[id].classList.toggle("is-ok", on && arrowIsCorrect(model, draft, id));
      chips[id].setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function paint() {
    syncArrowFlags();
    renderArrows();
    paintSteps();
    paintChips();
    fresh = null;
  }

  function finishDiagram(announceText, skipped) {
    if (solved) return;
    solved = true;
    flagged = new Set();
    note = "";
    svg.classList.add("is-solved");
    setDiagramDone(true);
    const line = announceText || ("Every force on the " + objectName + " is there, each arrow points the right way, and the sizes match the problem.");
    if (opts.hideFeedbackWhenSolved) {
      feedback.hidden = true;
      feedback.replaceChildren();
    } else {
      feedback.hidden = false;
      feedback.className = "feedback fbd-feedback is-right";
      feedback.replaceChildren(el("strong", {}, "Diagram correct. "), line);
    }
    feedbackRight();
    if (model.ask) mount.classList.add("has-ask");
    if (opts.onCorrect) opts.onCorrect({ skipped: !!skipped });
    onProgress(1);
    paint();
    announce("Diagram correct. " + line);
  }

  function edited(keepFeedback) {
    if (!keepFeedback && !solved) {
      feedback.className = "feedback fbd-feedback";
      feedback.textContent = "";
    }
    if (!solved) onProgress(Math.min(0.95, fbdFraction(model, draft)));
    paint();
    if (opts.onDraftChange) {
      opts.onDraftChange({
        isolated: isolated(),
        forceCount: draft.forces.size,
        forceIds: [...draft.forces],
        solved: solved,
        result: gradeFbd(model, draft)
      });
    }
  }

  check.addEventListener("click", () => {
    if (solved) return;
    const result = gradeFbd(model, draft);
    flagged = result.off;
    note = "";
    feedback.replaceChildren();
    if (result.ok) {
      finishDiagram("Every force on the " + objectName + " is there, each arrow points the right way, and the sizes match the problem.");
      return;
    } else {
      feedback.className = "feedback fbd-feedback is-wrong";
      const count = result.messages.length;
      feedback.append(el("strong", {}, count === 1 ? "One thing to fix. " : count + " things to fix. "), result.messages[0]);
      if (count > 1) feedback.append(el("ul", {}, result.messages.slice(1).map((message) => el("li", {}, message))));
      if (flagged.size) feedback.append(el("p", { class: "quiet" }, "Arrows that need work are ringed in red."));
      feedbackWrong();
      stage.classList.remove("is-nudge");
      void stage.offsetWidth;
      stage.classList.add("is-nudge");
      onProgress(fbdFraction(model, draft));
    }
    announce(feedback.textContent);
    paint();
  });

  clear.addEventListener("click", () => {
    if (solved) return;
    draft.forces.clear();
    draft.dirs = {};
    draft.lens = {};
    draft.angles = {};
    activeForce = null;
    touched = false;
    note = "";
    flagged = new Set();
    edited();
  });

  const adminSkip = adminSkipButton("Skip this question", () => finishDiagram("Skipped in admin mode.", true));
  if (adminSkip) mount.insertBefore(el("div", { class: "btn-row admin-skip-row" }, adminSkip), mount.querySelector(".fbd-actions"));

  paint();
}

function simArt(force, mass) {
  const width = 46 + mass * 3;
  const accel = force / mass;
  const arrow = Math.min(160, force * 3);
  const run = Math.min(200, accel * 18);
  return svgMarkup("0 0 360 180",
    '<line x1="20" y1="120" x2="340" y2="120" stroke="#1c2a24" stroke-width="3"/>' +
    '<rect x="70" y="' + (120 - width) + '" width="' + width + '" height="' + width + '" rx="6" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/>' +
    '<text x="' + (70 + width / 2) + '" y="' + (120 - width / 2) + '" text-anchor="middle" font-size="14" font-weight="700">' + mass + " kg</text>" +
    '<line x1="' + (70 + width) + '" y1="' + (120 - width / 2) + '" x2="' + (70 + width + arrow) + '" y2="' + (120 - width / 2) + '" stroke="#c05622" stroke-width="6" stroke-linecap="round"/>' +
    '<text x="' + (78 + width) + '" y="' + (108 - width / 2) + '" fill="#c05622" font-size="14" font-weight="700">F = ' + force + " N</text>" +
    '<line x1="70" y1="146" x2="' + (70 + run) + '" y2="146" stroke="#31457a" stroke-width="6" stroke-linecap="round"/>' +
    '<text x="70" y="168" fill="#31457a" font-size="14" font-weight="700">a = ' + accel.toFixed(2) + " m/s²</text>"
  );
}

function mountSim(host, onProgress) {
  const force = el("input", { class: "slider", type: "range", min: "0", max: "40", value: "10" });
  const mass = el("input", { class: "slider", type: "range", min: "1", max: "20", value: "5" });
  const stage = el("div", { class: "sim" });
  const readout = el("div", { class: "readout" });
  let moved = store.flag("s2moved");
  function paint() {
    const f = Number(force.value);
    const m = Number(mass.value);
    stage.replaceChildren(simArt(f, m));
    readout.textContent = "";
    readout.append(el("span", {}, "F = " + f + " N"));
    readout.append(el("span", {}, "m = " + m + " kg"));
    readout.append(el("span", {}, "a = " + (f / m).toFixed(2)));
  }
  function markMoved() {
    moved = true;
    if (!store.flag("s2moved")) store.setFlag("s2moved");
    paint();
    if (store.flag("s2e1") && store.flag("s2e2")) onProgress(1);
  }
  force.addEventListener("input", markMoved);
  mass.addEventListener("input", markMoved);
  host.append(
    el("label", {}, "Force (N)", force),
    el("label", {}, "Mass (kg)", mass),
    readout,
    stage,
    el("p", { class: "quiet" }, "Doubling the force doubles the acceleration. Doubling the mass cuts the acceleration in half. A zero net force means zero acceleration.")
  );
  const checks = el("div");
  mountProblemSet(checks, [
    { key: "s2e1", q: "Set the sliders, or just calculate: mass is 5 kg and the net force is 20 N. What is the acceleration?", answer: 4, unit: "m/s²", hint: "Acceleration is force shared out over mass, so divide the force by the mass.", why: "a = 20 / 5 = 4 m/s².",
      explain: "Newton's second law says F = ma. To find a, divide both sides by m: a = F / m = 20 N ÷ 5 kg = 4 m/s². Every kilogram gets 4 N of the push.",
      mistakes: [
        { value: 100, msg: "You multiplied 20 × 5. Multiplying gives force (F = ma), but here the force is already known. To get acceleration, divide the force by the mass." },
        { value: 0.25, msg: "You divided mass by force (5 ÷ 20). It is the other way round: a = F / m, so the force goes on top." },
        { value: 15, msg: "You subtracted 20 − 5. Force and mass are different kinds of quantity, so they can't be subtracted. Use a = F / m." },
        { value: 25, msg: "You added 20 + 5. Force and mass are different kinds of quantity, so they can't be added. Use a = F / m." }
      ] },
    { key: "s2e2", q: "Keep the force at 20 N and double only the mass to 10 kg. What is the new acceleration?", answer: 2, unit: "m/s²", hint: "A heavier object is harder to speed up. With the same force, more mass means less acceleration.", why: "a = 20 / 10 = 2 m/s².",
      explain: "a = F / m = 20 N ÷ 10 kg = 2 m/s². The mass doubled from 5 kg to 10 kg, so the acceleration halved from 4 to 2 m/s².",
      mistakes: [
        { value: 8, msg: "You doubled the acceleration. Doubling the mass makes the object harder to accelerate, so the acceleration gets smaller, not bigger." },
        { value: 4, msg: "That is the old answer for 5 kg. The mass is now 10 kg, so the same 20 N is spread over twice the mass." },
        { value: 200, msg: "You multiplied 20 × 10. That would be a force, not an acceleration. Divide the force by the mass." },
        { value: 0.5, msg: "You divided mass by force (10 ÷ 20). Put the force on top: a = F / m." }
      ] }
  ], (value) => {
    if (store.task(2, "explore") >= 1) return;
    const slid = moved || store.flag("s2moved");
    if (value >= 1 && slid) onProgress(1);
    else if (value >= 1) onProgress(0.85);
    else onProgress(value * 0.8);
    if (value >= 1 && !slid) {
      const note = checks.querySelector(".need-move") || el("p", { class: "quiet need-move" });
      note.textContent = "Move both sliders once so the diagram is part of the explore, then this part locks in.";
      checks.append(note);
    }
  });
  host.append(checks);
  paint();
}

function mountPairs(host, onDone) {
  const pairs = [
    ["Person pushes wall", "Wall pushes person"],
    ["Foot pushes ground backward", "Ground pushes foot forward"],
    ["Swimmer pushes water backward", "Water pushes swimmer forward"],
    ["Legs push Earth down in a jump", "Earth pushes the person up"],
    ["Foot pushes the ball", "Ball pushes the foot back"]
  ];
  const order = pairs.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = order[i];
    order[i] = order[j];
    order[j] = swap;
  }
  let pick = null;
  let matched = 0;
  const fb = el("p", { class: "feedback", "aria-live": "polite" });
  const left = el("div");
  const right = el("div");
  if (store.flag("s3match")) {
    host.append(el("p", { class: "feedback is-right" }, "All five pairs are matched. Each force acts on a different object."));
    onDone();
    return;
  }
  pairs.forEach((pair, index) => {
    const button = el("button", { class: "choice", type: "button" }, pair[0]);
    button.addEventListener("click", () => {
      if (button.disabled) return;
      left.querySelectorAll(".choice").forEach((node) => node.classList.remove("is-pick"));
      pick = button;
      button.classList.add("is-pick");
      button.dataset.index = String(index);
    });
    left.append(button);
  });
  order.forEach((index) => {
    const button = el("button", { class: "choice", type: "button" }, pairs[index][1]);
    button.addEventListener("click", () => {
      if (!pick || button.disabled) {
        fb.className = "feedback is-wrong";
        fb.textContent = "Choose the action on the left first.";
        sfx.bad();
        return;
      }
      if (pick.dataset.index === String(index)) {
        pick.disabled = true;
        button.disabled = true;
        pick.classList.remove("is-pick");
        pick.classList.add("is-right");
        button.classList.add("is-right");
        pick = null;
        matched += 1;
        fb.className = "feedback is-right";
        fb.textContent = matched === pairs.length ? "All pairs matched. The two forces are equal and act on different objects." : "Matched.";
        sfx.ok();
        if (matched === pairs.length) {
          store.setFlag("s3match");
          onDone();
        }
      } else {
        fb.className = "feedback is-wrong";
        fb.textContent = "Those two are not a pair. Look for the force on the other object.";
        sfx.bad();
      }
      announce(fb.textContent);
    });
    right.append(button);
  });
  host.append(el("p", {}, "Pick an action on the left, then its reaction on the right."), el("div", { class: "pair" }, left, right), fb);
}

function mountScenarios(host, items, onProgress, sceneNav) {
  function situationDone(item) {
    return store.flag(item.key) && (!item.follow || store.flag(item.follow.key));
  }
  let cursor = items.findIndex((item) => !situationDone(item));
  if (cursor < 0) cursor = 0;
  const box = el("div");
  const dots = el("div", { class: "q-top" });
  host.append(dots, box);

  function report() {
    if (sceneNav) {
      sceneNav.active = true;
      sceneNav.index = cursor;
      sceneNav.total = items.length;
      sceneNav.stepReady = situationDone(items[cursor]);
      sceneNav.allDone = items.every(situationDone);
    }
    const solved = items.filter(situationDone).length;
    onProgress(solved === items.length ? 1 : solved / items.length);
  }

  function show() {
    dots.textContent = "Situation " + (cursor + 1) + " of " + items.length;
    box.replaceChildren();
    const item = items[cursor];
    if (item.scene) box.append(figure(item.scene));
    box.append(el("p", { class: "kicker" }, item.title));
    const beat = el("div");
    box.append(beat);
    const second = item.follow;
    mountFormative(beat, item, () => {
      if (!second) {
        report();
        return;
      }
      const nextBeat = el("div");
      box.append(nextBeat);
      mountFormative(nextBeat, second, () => report());
    });
    report();
  }

  if (sceneNav) {
    sceneNav.goNext = () => {
      if (cursor >= items.length - 1 || !situationDone(items[cursor])) return;
      cursor += 1;
      show();
      window.scrollTo(0, 0);
    };
    sceneNav.goPrev = () => {
      if (cursor <= 0) return;
      cursor -= 1;
      show();
      window.scrollTo(0, 0);
    };
  }
  show();
}

function recordQuiz(session, key, score, total, passed) {
  const ratio = score / total;
  const bestKey = session + "." + key;
  const prev = store.data.best[bestKey] || 0;
  store.data.best[bestKey] = Math.max(prev, ratio);
  store.setTask(session, key, passed ? 1 : ratio);
  if ((store.data.best[bestKey] || 0) !== prev) store.save();
}

const QUIZ_1 = [
  { q: "What happens to an object when the net force acting on it is zero?", choices: ["It must accelerate", "It remains at rest or moves at constant velocity", "It changes direction", "It stops immediately"], answer: 1, why: "Zero net force means the velocity does not change. Rest is just constant velocity of zero." },
  { q: "Inertia is best described as…", choices: ["A force that keeps objects moving", "The tendency to resist changes in motion", "Another name for weight", "The push from friction"], answer: 1, why: "Inertia is a property of matter, not a force you draw on a diagram." },
  { q: "A book rests on a table. Which description of the forces on the book is right?", choices: ["Only gravity acts, because the book is still", "Gravity pulls down and the table pushes up harder", "Gravity down and the normal force up balance", "No forces act on a resting object"], answer: 2, why: "Both forces act on the book. They are equal and opposite, so the net force is zero." },
  { q: "A passenger moves forward when a bus suddenly stops. Why?", choices: ["The brakes push the passenger forward", "Inertia keeps the passenger moving at the old velocity", "Gravity pulls the passenger toward the front", "The seat pulls the passenger forward"], answer: 1, why: "The bus slows because of a force on the bus. The passenger keeps going until a force, such as a seatbelt, acts on the passenger." },
  { q: "A puck glides in a straight line at constant speed on very smooth ice. The net force on the puck is…", choices: ["Forward, to keep it moving", "Backward, because ice is cold", "Zero", "Equal to its weight"], answer: 2, why: "Constant velocity is the first-law clue: the net force is zero." },
  { q: "Which situation has an unbalanced force?", choices: ["A parked bicycle", "A book resting on a desk", "A hockey puck slowing as it slides on rough ice", "A spacecraft coasting with engines off in deep space"], answer: 2, why: "The puck’s speed changes, so the net force is not zero. Rough ice supplies friction." },
  { q: "A moving cart has all forces balanced. What does it do next?", choices: ["It stops at once", "It keeps the same velocity", "It must speed up", "It must turn"], answer: 1, why: "Balanced forces mean zero net force, so the velocity stays as it is." },
  { q: "A seatbelt is useful in a sudden stop because…", choices: ["It removes the passenger’s inertia", "It supplies the force that changes the passenger’s motion", "It cancels gravity", "It makes the car’s net force zero"], answer: 1, why: "Without a force on the passenger, the passenger continues forward while the car slows." }
];

const QUIZ_2 = [
  { q: "Newton’s second law is written…", choices: ["F = m / a", "F = ma", "a = mF", "m = a / F"], answer: 1, why: "Net force equals mass times acceleration." },
  { q: "The same net force is applied to a heavier object. Its acceleration…", choices: ["Increases", "Decreases", "Stays the same", "Becomes the mass"], answer: 1, why: "a = F / m, so a larger mass gives a smaller acceleration." },
  { q: "If the net force on an object triples and the mass stays the same, the acceleration…", choices: ["Triples", "Drops to one third", "Stays the same", "Becomes zero"], answer: 0, why: "Acceleration is proportional to net force." },
  { q: "A 4 kg box feels a net force of 8 N. Its acceleration is…", choices: ["0.5 m/s²", "2 m/s²", "12 m/s²", "32 m/s²"], answer: 1, why: "a = 8 / 4 = 2 m/s²." },
  { q: "When the net force is zero, the acceleration is…", choices: ["Zero", "Equal to the mass", "9.8 m/s² upward", "Impossible to know"], answer: 0, why: "a = F / m = 0. This is how the second law agrees with the first." },
  { q: "The direction of the acceleration matches…", choices: ["The heaviest single force, always", "The direction of the net force", "The direction of friction, always", "The direction the object used to move"], answer: 1, why: "Acceleration points the same way as the net force, even if the object is still moving the other way while it slows down." },
  { q: "One newton is the same as…", choices: ["1 kg", "1 m/s", "1 kg·m/s²", "1 kg/m"], answer: 2, why: "From F = ma, the unit of force is the kilogram meter per second squared." }
];

const QUIZ_3 = [
  { q: "You push a wall. Which force is the reaction?", choices: ["The wall pushes you", "Gravity pulls you down", "The floor’s normal force", "Friction on your shoes only"], answer: 0, why: "The reaction to “you push the wall” is “the wall pushes you,” equal in size and opposite in direction." },
  { q: "Action and reaction forces…", choices: ["Act on the same object and cancel", "Act on different objects", "Are equal only when the objects have the same mass", "Happen one after the other, with the action first"], answer: 1, why: "They are partners, but they are never both drawn on the same free-body diagram." },
  { q: "A book rests on a table. Are the book’s weight and the normal force a third-law pair?", choices: ["Yes, because they are equal and opposite", "No. Both forces act on the book"], answer: 1, why: "A third-law pair acts on two different objects. The partner to the book’s weight is the book’s pull on Earth." },
  { q: "A rocket pushes exhaust gas downward. The reaction is…", choices: ["Gravity pulling the gas", "The gas pushing the rocket upward", "Air pushing the rocket", "The rocket’s inertia"], answer: 1, why: "The gas pushes back on the rocket. That upward force on the rocket is what lifts it." },
  { q: "A child pushes a heavy adult on ice. The forces between them…", choices: ["Are larger on the adult", "Are equal in size, even though the adult barely moves", "Exist only on the child", "Cancel because both people are touching"], answer: 1, why: "The pair is always equal. The lighter person has the larger acceleration." }
];

function learnCopy(id) {
  if (id === 1) {
    return el("div", {},
      el("p", {}, "Newton’s first law is the law of inertia. An object does not change its motion by itself."),
      el("div", { class: "callout" }, el("p", { class: "kicker" }, "Key idea"), el("strong", {}, "An object remains at rest or continues moving at constant velocity unless acted upon by an unbalanced external force.")),
      figure("book", "A resting book: gravity down, normal force up, same size. Net force zero."),
      el("h3", {}, "Important terms"),
      el("ul", { class: "terms" },
        el("li", {}, el("b", {}, "Force"), "A push or a pull. The unit is the newton (N)."),
        el("li", {}, el("b", {}, "Net force"), "The sum of every force on one object, taking direction into account."),
        el("li", {}, el("b", {}, "Balanced forces"), "Forces that add to zero net force. Motion does not change."),
        el("li", {}, el("b", {}, "Unbalanced force"), "A nonzero net force. Velocity changes."),
        el("li", {}, el("b", {}, "Inertia"), "The tendency to keep the same motion. Not a force."),
        el("li", {}, el("b", {}, "Constant velocity"), "Same speed and same direction. Rest is the special case of zero velocity.")
      ),
      el("h3", {}, "Real-life examples"),
      el("div", { class: "examples" },
        el("article", { class: "mini" }, el("strong", {}, "Book on a table"), el("p", {}, "It stays put. Gravity and the normal force balance.")),
        el("article", { class: "mini" }, el("strong", {}, "Puck on ice"), el("p", {}, "It keeps gliding nearly straight. Almost no horizontal force acts.")),
        el("article", { class: "mini" }, figure("bus"), el("strong", {}, "Braking bus"), el("p", {}, "The bus slows. A passenger who is not held keeps the old forward motion."))
      )
    );
  }
  if (id === 2) {
    return el("div", {},
      el("p", {}, "Newton’s second law connects the cause of a change in motion to how large that change is."),
      el("div", { class: "flow" }, el("span", {}, "Force"), el("i", {}, "to"), el("span", {}, "Mass"), el("i", {}, "to"), el("span", {}, "Acceleration")),
      el("p", { class: "equation", "aria-label": "F equals m a" }, el("span", {}, "F"), el("span", {}, "="), el("span", {}, "m"), el("span", {}, "a")),
      el("p", {}, "The net force on an object equals its mass times its acceleration. Rearranged, a = F / m. A larger net force means a larger acceleration. A larger mass means a smaller acceleration for the same force."),
      el("div", { class: "callout" }, el("strong", {}, "1 N = 1 kg·m/s²"), el("p", {}, "Acceleration points in the direction of the net force, not always in the direction the object is already moving."))
    );
  }
  if (id === 3) {
    return el("div", {},
      el("p", { class: "equation" }, "Action", el("span", {}, "  ↔  "), "Reaction"),
      el("p", {}, "Forces occur in pairs. If object A pushes on object B, object B pushes on object A with a force of equal size in the opposite direction. The two forces act on different objects, so they never cancel on one free-body diagram."),
      figure("pair", "Two objects, two arrows. Equal length, opposite direction, different bodies."),
      el("div", { class: "callout" }, el("strong", {}, "Same size. Opposite direction. Different objects."), el("p", {}, "The pair is equal even when the objects have very different masses. The lighter object simply accelerates more."))
    );
  }
  if (id === 4) {
    return el("div", {},
      el("p", {}, "A free-body diagram (FBD) shows one object by itself and every force on that object as a labeled arrow. The surroundings disappear. Only forces remain."),
      figure("lamp", "Teaching example: a lamp at rest. Gravity down, tension up, equal lengths."),
      el("h3", {}, "Build every diagram in this order"),
      el("ol", { class: "terms" },
        el("li", {}, el("b", {}, "1. Object"), "Name the single body you are studying."),
        el("li", {}, el("b", {}, "2. Forces"), "List only the forces on that body."),
        el("li", {}, el("b", {}, "3. Direction"), "Each force gets one direction."),
        el("li", {}, el("b", {}, "4. Force arrows"), "Draw them from the object. Longer can mean stronger."),
        el("li", {}, el("b", {}, "5. Labels"), "Use Fg, FN, Fa, Ff, or FT.")
      ),
      el("div", { class: "callout" }, el("strong", {}, "Leave out “force of motion.”"), el("p", {}, "Motion is not a force. Also leave out forces that this object exerts on something else. Those belong on the other object’s diagram."))
    );
  }
  return el("div", {},
    el("p", {}, "This session does not add a new law. You use the first three laws and a free-body diagram on one problem."),
    el("ol", { class: "terms" },
      el("li", {}, el("b", {}, "Read"), "Pull the numbers and directions out of the words."),
      el("li", {}, el("b", {}, "Identify"), "One object, then the forces on it."),
      el("li", {}, el("b", {}, "Construct"), "Draw the diagram."),
      el("li", {}, el("b", {}, "Analyze"), "Add the forces along each line to get the net force."),
      el("li", {}, el("b", {}, "Apply"), "Use F = ma when the net force is not zero."),
      el("li", {}, el("b", {}, "Check"), "Object, forces, directions, diagram, equation, and answer.")
    )
  );
}

const EXPLORE_3 = [
  { title: "Pushing a wall", text: "Your hand pushes the wall. The wall pushes your hand the other way, equally hard. You feel that push. The wall feels yours." },
  { title: "Walking", text: "Your foot pushes the ground backward. The ground pushes your foot forward. That forward force on you is why you start moving." },
  { title: "Jumping", text: "Your legs push Earth downward a little. Earth pushes you upward. You leave the floor; Earth barely moves." },
  { title: "Swimming", text: "You push water backward. The water pushes you forward. The pair explains the swim, not a forward force from “motion.”" },
  { title: "Kicking a ball", text: "Your foot pushes the ball. The ball pushes your foot backward during the kick. The forces match; the ball accelerates more because its mass is smaller." }
];

function explorePanel(id, onProgress, sceneNav) {
  const host = el("div");
  if (id === 1) {
    mountScenarios(host, [
      {
        key: "s1a",
        scene: "book",
        title: "A book is resting on a table.",
        q: "What happens to the book?",
        choices: ["It stays at rest", "It accelerates down through the table", "It starts sliding sideways by itself"],
        answer: 0,
        hint: "Look at whether the velocity is changing.",
        why: "The book remains at rest. Its velocity is already zero and stays zero.",
        follow: {
          key: "s1b",
          q: "Why does that happen?",
          choices: ["Gravity and the normal force balance, so the net force is zero", "No forces act on a resting object", "Inertia is an upward force that cancels gravity"],
          answer: 0,
          hint: "Name the downward force and the upward force.",
          why: "Gravity pulls the book down. The table pushes up with the normal force. They balance."
        }
      },
      {
        key: "s1c",
        scene: "bus",
        title: "A moving bus brakes suddenly.",
        q: "What happens to a standing passenger who is not holding on?",
        choices: ["The passenger continues forward relative to the bus", "The passenger is thrown toward the back of the bus", "The passenger instantly matches the slower speed with no force"],
        answer: 0,
        hint: "Think about the motion the passenger already had.",
        why: "The passenger keeps moving forward while the bus slows, so the passenger lurches toward the front.",
        follow: {
          key: "s1d",
          q: "Why?",
          choices: ["Inertia: the passenger keeps the earlier velocity until a force acts on them", "The brakes push the passenger forward", "Gravity pulls the passenger toward the front of the bus"],
          answer: 0,
          hint: "The brake force acts on the bus, not automatically on the passenger.",
          why: "No forward force is required. The passenger’s inertia keeps the old velocity."
        }
      }
    ], onProgress, sceneNav);
    return host;
  }
  if (id === 2) {
    mountSim(host, onProgress);
    return host;
  }
  if (id === 3) {
    const opened = new Set(EXPLORE_3.map((item, index) => store.flag("s3see" + index) ? index : -1).filter((index) => index >= 0));
    host.append(el("p", {}, "Open each everyday case. Name the two objects before you move on."));
    EXPLORE_3.forEach((item, index) => {
      const button = el("button", { class: "choice" + (opened.has(index) ? " is-right" : ""), type: "button" }, item.title);
      const note = el("p", { class: "quiet" });
      if (opened.has(index)) note.textContent = item.text;
      button.addEventListener("click", () => {
        opened.add(index);
        store.setFlag("s3see" + index);
        button.classList.add("is-right");
        note.textContent = item.text;
        onProgress(opened.size === EXPLORE_3.length ? 1 : opened.size / EXPLORE_3.length);
      });
      host.append(button, note);
    });
    if (opened.size === EXPLORE_3.length) onProgress(1);
    return host;
  }
  return host;
}

function quizBank(id) {
  if (id === 1) return QUIZ_1;
  if (id === 2) return QUIZ_2;
  return QUIZ_3;
}

function passNeed(total) {
  return Math.ceil(total * 0.7);
}

function challengeAllDone() {
  return CHALLENGE_POOL.every((item) => store.flag("ch." + item.key));
}

function continueHash() {
  if (!tutorialDone()) return "#/tutorial";
  for (let law = 1; law <= 3; law += 1) {
    if (!lawIntroSeen(law) && (law === 1 ? law1Unlocked() : law === 2 ? law2Unlocked() : law3Unlocked())) {
      return "#/law/" + law;
    }
    for (const diff of ["easy", "moderate", "hard"]) {
      const set = getLawProblems(law, diff) || [];
      for (let i = 1; i <= set.length; i += 1) {
        if (!isProblemSolved(problemKey(law, diff, i))) {
          if (!diffUnlocked(law, diff) || !problemUnlocked(law, diff, i)) return "#/law/" + law;
          return "#/play/" + law + "/" + diff + "/" + i;
        }
      }
    }
  }
  if (!challengeAllDone()) return challengeUnlocked() ? "#/challenge" : "#/law/3";
  return "#/final";
}

function formatTime(sec) {
  return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
}

function timerHost() {
  return document.getElementById("timer-host");
}

function hideTimerHost() {
  const host = timerHost();
  if (!host) return;
  host.replaceChildren();
  host.hidden = true;
  document.body.classList.remove("has-timer");
}

function readTimerEndAt(timerId) {
  try {
    const raw = JSON.parse(localStorage.getItem(TIMER_STORE_KEY));
    if (!raw || raw.id !== timerId || !Number.isFinite(raw.endAt)) return null;
    return raw.endAt;
  } catch (err) {
    return null;
  }
}

function writeTimerEndAt(timerId, endAt) {
  try {
    localStorage.setItem(TIMER_STORE_KEY, JSON.stringify({ id: timerId, endAt: endAt }));
  } catch (err) { /* private mode */ }
}

function clearTimerStore(timerId) {
  try {
    const raw = JSON.parse(localStorage.getItem(TIMER_STORE_KEY));
    if (!raw) return;
    if (!timerId || raw.id === timerId) localStorage.removeItem(TIMER_STORE_KEY);
  } catch (err) {
    try { localStorage.removeItem(TIMER_STORE_KEY); } catch (e) { /* */ }
  }
}

function timerSecondsLeft(timerId, totalSeconds) {
  const now = Date.now();
  let endAt = readTimerEndAt(timerId);
  if (endAt == null) {
    endAt = now + totalSeconds * 1000;
    writeTimerEndAt(timerId, endAt);
  }
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

function mountTimer(timerId, seconds, onExpire) {
  const host = timerHost();
  if (!host) return () => {};
  let expired = false;
  let firedExpire = false;

  function paintLeft(left) {
    const text = formatTime(left);
    strong.textContent = text;
    node.setAttribute("aria-label", left > 0 ? "Time remaining " + text : "Time is up");
    node.classList.toggle("is-low", left > 0 && left <= 15);
    node.classList.toggle("is-up", left <= 0);
  }

  function expire() {
    if (firedExpire) return;
    firedExpire = true;
    expired = true;
    paintLeft(0);
    onExpire();
  }

  const strong = el("strong", {}, formatTime(seconds));
  const node = el("div", { class: "timer", role: "timer", "aria-label": "Time remaining " + formatTime(seconds) },
    el("span", { class: "timer__label" }, "Time"),
    strong
  );
  host.hidden = false;
  document.body.classList.add("has-timer");
  host.replaceChildren(node);

  let prevLeft = timerSecondsLeft(timerId, seconds);
  paintLeft(prevLeft);
  if (prevLeft <= 0) {
    window.setTimeout(expire, 0);
    return (clear) => {
      expired = true;
      hideTimerHost();
      if (clear) clearTimerStore(timerId);
    };
  }

  const id = window.setInterval(() => {
    if (expired) return;
    const left = timerSecondsLeft(timerId, seconds);
    if (left < prevLeft && left <= 5 && left > 0) sfx.tick();
    prevLeft = left;
    paintLeft(left);
    if (left <= 0) {
      window.clearInterval(id);
      expire();
    }
  }, 1000);

  return (clear) => {
    expired = true;
    window.clearInterval(id);
    hideTimerHost();
    if (clear) clearTimerStore(timerId);
  };
}

function topicLocked(topic) {
  return (topic.id === "law1" && !law1Unlocked())
    || (topic.id === "law2" && !law2Unlocked())
    || (topic.id === "law3" && !law3Unlocked())
    || (topic.id === "challenge" && !challengeUnlocked())
    || (topic.id === "finale" && !courseComplete());
}

function topicLockMessage(topic) {
  if (topic.id === "law1") return MSG_TUTORIAL_FIRST;
  if (topic.id === "law2") return "Finish Difficult of Newton’s First Law first.";
  if (topic.id === "law3") return "Finish Difficult of Newton’s Second Law first.";
  if (topic.id === "challenge") return "Finish Difficult of Newton’s Third Law first.";
  if (topic.id === "finale") return "Finish the challenge first. Then Newton’s orchard opens.";
  return "Finish the previous lesson first.";
}

function topicStatus(topic) {
  if (topicLocked(topic)) return "Locked";
  if (topic.id === "tutorial") return tutorialDone() ? "Done" : "Start";
  const lawId = topic.id === "law1" ? 1 : topic.id === "law2" ? 2 : topic.id === "law3" ? 3 : 0;
  if (lawId) {
    const done = lawSolvedCount(lawId);
    if (done >= lawProblemCount(lawId)) return "Done";
    if (done > 0) return "Continue";
    return "Start";
  }
  if (topic.id === "challenge") {
    if (challengeAllDone()) return "Done";
    if (CHALLENGE_POOL.some((item) => store.flag("ch." + item.key))) return "Continue";
    return "Start";
  }
  if (topic.id === "finale") return courseComplete() ? "Open" : "Start";
  return "Start";
}

function topicCard(topic) {
  const locked = topicLocked(topic);
  const node = el(locked ? "button" : "a", {
    class: "topic-card tone-" + topic.tone + (locked ? " is-locked" : ""),
    href: locked ? null : topic.href,
    type: locked ? "button" : null
  });
  node.append(el("p", { class: "topic-card__tag" }, topicStatus(topic)), el("h3", {}, topic.title), el("p", {}, topic.blurb));
  if (locked) node.addEventListener("click", () => showLockPopup(topicLockMessage(topic), true));
  return node;
}

function revealResult(node) {
  if (!node) return;
  const go = () => {
    const mobile = window.matchMedia("(max-width: 720px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: mobile ? "center" : "nearest",
      inline: "nearest"
    });
  };
  requestAnimationFrame(() => requestAnimationFrame(go));
}

function levelShortName(diff) {
  return { easy: "Easy", moderate: "Moderate", hard: "Difficult" }[diff] || "this level";
}

function appendFbdWin(card, message, actions, why) {
  card.classList.add("is-fbd-solved");
  const win = el("div", { class: "fbd-win" },
    el("p", { class: "feedback is-right" }, message));
  if (why) win.append(el("p", { class: "fbd-win__why" }, why));
  win.append(el("p", { class: "fbd-win__next" }, "What to do next"), actions);
  card.append(win);
  revealResult(win);
  return win;
}

function playSuccessActions(law, diff, n) {
  const set = getLawProblems(law, diff) || [];
  const row = el("div", { class: "btn-row fbd-win__actions" });
  if (n < set.length) {
    row.append(el("a", { class: "btn btn--hero", href: "#/play/" + law + "/" + diff + "/" + (n + 1) }, "Continue to problem " + (n + 1), el("span", { "aria-hidden": "true" }, "→")));
  } else if (diff === "easy") {
    row.append(el("a", { class: "btn btn--hero", href: "#/play/" + law + "/moderate/1" }, "Start Moderate", el("span", { "aria-hidden": "true" }, "→")));
  } else if (diff === "moderate") {
    row.append(el("a", { class: "btn btn--hero", href: "#/play/" + law + "/hard/1" }, "Start Difficult", el("span", { "aria-hidden": "true" }, "→")));
  } else if (law < 3) {
    row.append(el("a", { class: "btn btn--hero", href: "#/law/" + (law + 1) }, "Go to the next lesson", el("span", { "aria-hidden": "true" }, "→")));
  } else {
    row.append(el("a", { class: "btn btn--hero", href: "#/challenge" }, "Go to the challenge", el("span", { "aria-hidden": "true" }, "→")));
  }
  row.append(el("a", { class: "btn btn--ghost", href: "#/law/" + law }, "Back to " + levelShortName(diff) + " problems"));
  return row;
}

function tutorialGuide(s) {
  if (s.solved) return {
    title: "Tutorial complete",
    body: "Only two forces act on the book. Weight (Fg) pulls it straight down. The table’s normal force (Fn) pushes straight up. They are equal, so the book stays at rest. Extra forces do not belong here.",
    tone: "done"
  };
  if (!s.isolated) {
    return {
      title: "Step 1 · Isolate the object",
      body: "Tap the book to separate it from the table and floor. Only the object of interest stays in the diagram.",
      tone: "action"
    };
  }
  const ids = s.forceIds || [];
  if (!ids.length) {
    return {
      title: "Step 2 · Represent the object simply",
      body: "The book is drawn as a simple box at the center. Next, identify which forces act on it.",
      tone: "action"
    };
  }
  if (!ids.includes("gravity")) {
    return {
      title: "Step 3 · Identify all forces",
      body: "The tray lists common forces. For a book on a table, add weight first—it points down. Forces that do not belong on this object will not stay on the diagram.",
      tone: "action"
    };
  }
  if (!ids.includes("normal")) {
    return {
      title: "Step 3 · Identify all forces",
      body: "Add normal force next — perpendicular to the table, pointing up on the book.",
      tone: "action"
    };
  }
  return {
    title: "Steps 4–6 · Draw, label, and axes",
    body: "Drag each arrow or label (Fg, Fn) to aim and size it. Symbols label each force. Blue x- and y-axes show directions. Tap Check diagram when ready.",
    tone: "action"
  };
}

function finishTutorial() {
  store.data.tutorial = 1;
  try { localStorage.setItem(KEY, JSON.stringify(store.data)); } catch (err) { /* private mode */ }
  store.painting = true;
  try { refreshProgressUI(); } finally { store.painting = false; }
  if ((location.hash || "#/") !== "#/law/1") location.hash = "#/law/1";
  route();
}

function mountFbdTutorial(host) {
  let draftState = { isolated: false, forceCount: 0, forceIds: [], solved: false };
  const guideBox = el("div", { class: "tutorial-guide" });
  const guideTitle = el("h2", { class: "tutorial-guide__title" });
  const guideBody = el("p", { class: "tutorial-guide__body" });
  const demo = el("div", { class: "tutorial-demo" });
  const card = el("section", { class: "card tutorial-card" });

  function paintGuide() {
    const g = tutorialGuide(draftState);
    guideBox.className = "tutorial-guide" + (g.tone === "done" ? " is-done" : " is-action");
    guideTitle.textContent = g.title;
    guideBody.textContent = g.body;
  }

  const liveOpts = {
    focusCanvas: true,
    hideSteps: true,
    hideCoach: true,
    hideSituation: true,
    showAxes: true,
    rejectExtra: true,
    trayIds: TUTORIAL_TRAY_IDS,
    hideFeedbackWhenSolved: true,
    onDraftChange(s) {
      draftState = {
        isolated: s.isolated,
        forceCount: s.forceCount,
        forceIds: s.forceIds || [],
        solved: s.solved
      };
      paintGuide();
    },
    onCorrect() {
      draftState.solved = true;
      demo.classList.add("is-complete");
      card.classList.add("is-complete");
      paintGuide();
      if (!tutorialDone()) {
        store.data.tutorial = 1;
        store.save();
      }
      refreshProgressUI();
      location.hash = "#/levelup/tutorial";
      route();
    }
  };

  paintGuide();
  mountFbd(demo, fbdModel("A book rests on a table.", "Book", ["Book", "Table", "Floor"],
    [{ id: "gravity", dir: "down" }, { id: "normal", dir: "up" }], { eq: [["gravity", "normal"]] }), () => {}, liveOpts);

  guideBox.append(guideTitle, guideBody);
  card.append(
    el("div", { class: "tutorial-card__head" },
      el("p", { class: "kicker" }, "Lesson 1"),
      el("h1", {}, "Free-body diagram tutorial")
    ),
    guideBox,
    demo
  );
  host.append(card);
}

function viewTutorial() {
  const wrap = el("div", { class: "wrap tutorial-wrap" });
  mountFbdTutorial(wrap);
  return wrap;
}

function viewLearn() {
  return el("div", { class: "wrap" },
    el("p", { class: "kicker" }, "Course"),
    el("h1", {}, "All lessons"),
    el("p", { class: "lede" }, "Work through the tutorial, then each of Newton’s laws at easy, moderate, and difficult levels. A timer keeps track while you practice."),
    el("div", { class: "topic-grid" }, TOPICS.map(topicCard))
  );
}

function lawLockedView(id) {
  let message = MSG_TUTORIAL_FIRST;
  let href = "#/tutorial";
  let label = "Go to tutorial";
  if (id === 2) {
    message = "Finish Difficult of Newton’s First Law first.";
    href = "#/law/1";
    label = "Newton’s First Law";
  } else if (id === 3) {
    message = "Finish Difficult of Newton’s Second Law first.";
    href = "#/law/2";
    label = "Newton’s Second Law";
  }
  return el("div", { class: "wrap card" }, el("h1", {}, "Locked"), el("p", {}, message), el("a", { class: "btn", href: href }, label));
}

function levelWinMessage(law, diff, n) {
  const set = getLawProblems(law, diff) || [];
  if (n < set.length) return "Correct. Problem " + n + " of " + set.length + " is done.";
  return "Correct. You finished every " + levelShortName(diff) + " problem in this lesson.";
}

function levelUpHash(law, diff) {
  return "#/levelup/" + law + "/" + diff;
}

function levelUpCopy(law, diff) {
  const intro = LAW_INTRO[law];
  const lawLabel = intro ? intro.kicker : "This lesson";
  if (diff === "easy") {
    return {
      badge: "Easy cleared",
      title: "Nice work—you finished Easy!",
      lede: "You solved all five " + lawLabel + " problems with two forces.",
      teaser: "Moderate is unlocked. Each diagram now has three forces.",
      primary: { label: "Level up to Moderate", href: "#/play/" + law + "/moderate/1" },
      secondary: { label: "Review Easy", href: "#/law/" + law }
    };
  }
  if (diff === "moderate") {
    return {
      badge: "Moderate cleared",
      title: "You leveled up again!",
      lede: "Three-force diagrams are done for " + lawLabel + ".",
      teaser: "Difficult is waiting—more forces, tougher setups, same skills.",
      primary: { label: "Level up to Difficult", href: "#/play/" + law + "/hard/1" },
      secondary: { label: "See all levels", href: "#/law/" + law }
    };
  }
  if (law < 3) {
    const next = LAW_INTRO[law + 1];
    return {
      badge: "Law complete",
      title: "You finished " + lawLabel + "!",
      lede: "Easy, Moderate, and Difficult are all checked off.",
      teaser: next ? "When you’re ready, open " + next.kicker + "." : "",
      primary: { label: "Start " + (next ? next.title : "next law"), href: "#/law/" + (law + 1) },
      secondary: { label: "Review this law", href: "#/law/" + law }
    };
  }
  return {
    badge: "Huge milestone",
    title: "All three laws complete!",
    lede: "You worked through every level of Newton’s first, second, and third law.",
    teaser: "The mixed Challenge is open—see if you can spot the law without a hint.",
    primary: { label: "Go to Challenge", href: "#/challenge" },
    secondary: { label: "Browse lessons", href: "#/learn" }
  };
}

function viewLevelUp(law, diff) {
  if (!["easy", "moderate", "hard"].includes(diff) || law < 1 || law > 3) {
    return el("div", { class: "wrap card" }, el("a", { class: "btn", href: "#/learn" }, "Back to lessons"));
  }
  if (!tierComplete(law, diff)) {
    return el("div", { class: "wrap card" },
      el("h1", {}, "Keep going"),
      el("p", {}, "Finish every problem in this level to unlock the celebration screen."),
      el("a", { class: "btn", href: "#/law/" + law }, "Back to levels"));
  }
  const copy = levelUpCopy(law, diff);
  const page = el("div", { class: "wrap levelup-page" });
  const card = el("section", { class: "card levelup-card" },
    el("p", { class: "levelup-badge" }, copy.badge),
    el("h1", { class: "levelup-title" }, copy.title),
    el("p", { class: "levelup-lede" }, copy.lede),
    el("p", { class: "levelup-teaser" }, copy.teaser),
    el("div", { class: "btn-row levelup-actions" },
      el("a", { class: "btn btn--hero levelup-go", href: copy.primary.href }, copy.primary.label, el("span", { "aria-hidden": "true" }, " →")),
      el("a", { class: "btn btn--ghost", href: copy.secondary.href }, copy.secondary.label)
    )
  );
  page.append(card);
  window.scrollTo(0, 0);
  requestAnimationFrame(() => {
    try { sfx.ok(); } catch (err) { /* audio optional */ }
  });
  return page;
}

function viewTutorialLevelUp() {
  if (!tutorialDone()) {
    return el("div", { class: "wrap card" },
      el("p", {}, "Complete the tutorial first."),
      el("a", { class: "btn", href: "#/tutorial" }, "Open tutorial"));
  }
  const page = el("div", { class: "wrap levelup-page" });
  page.append(el("section", { class: "card levelup-card" },
    el("p", { class: "levelup-badge" }, "Tutorial complete"),
    el("h1", { class: "levelup-title" }, "You’re ready for the laws!"),
    el("p", { class: "levelup-lede" }, "You can isolate an object, add forces, and check a diagram."),
    el("p", { class: "levelup-teaser" }, "Newton’s First Law is next—start with Easy and work your way up."),
    el("div", { class: "btn-row levelup-actions" },
      el("a", { class: "btn btn--hero levelup-go", href: "#/law/1" }, "Start Newton’s First Law", el("span", { "aria-hidden": "true" }, " →")),
      el("a", { class: "btn btn--ghost", href: "#/tutorial" }, "Review tutorial")
    )
  ));
  window.scrollTo(0, 0);
  requestAnimationFrame(() => { try { sfx.ok(); } catch (err) { /* */ } });
  return page;
}

function viewLaw(id) {
  if (id === 1 && !law1Unlocked()) return lawLockedView(1);
  if (id === 2 && !law2Unlocked()) return lawLockedView(2);
  if (id === 3 && !law3Unlocked()) return lawLockedView(3);
  markLawIntroSeen(id);
  const intro = LAW_INTRO[id];
  const wrap = el("div", { class: "wrap" });
  wrap.append(
    el("p", { class: "kicker" }, intro.kicker),
    el("h1", {}, intro.title),
    el("section", { class: "card law-explain" },
      el("p", { class: "kicker" }, "Read this first"),
      el("p", { class: "lede" }, intro.lede),
      el("ul", { class: "law-explain__list" }, (intro.points || []).map((point) => el("li", {}, point)))
    )
  );
  ["easy", "moderate", "hard"].forEach((diff) => {
    const locked = !diffUnlocked(id, diff);
    const set = getLawProblems(id, diff) || [];
    const solved = set.filter((_, i) => isProblemSolved(problemKey(id, diff, i + 1))).length;
    const section = el("section", { class: "card" + (locked ? " is-locked-card" : "") },
      el("h2", {}, LEVEL_LABEL[diff]),
      el("p", {}, locked ? "Finish the previous level to open this one." : DIFF_HINT[diff] + " " + solved + " of " + set.length + " done.")
    );
    const list = el("div", { class: "problem-dots", "aria-label": "Problems" });
    set.forEach((_, i) => {
      const n = i + 1;
      const key = problemKey(id, diff, n);
      const done = isProblemSolved(key);
      const open = !locked && problemUnlocked(id, diff, n);
      if (!open) {
        const btn = el("button", { type: "button", "aria-label": "Problem " + n + " locked" }, String(n));
        btn.addEventListener("click", () => showLockPopup(locked ? "Finish the previous level first." : "Finish the previous problem first.", true));
        list.append(btn);
        return;
      }
      list.append(el("a", {
        href: "#/play/" + id + "/" + diff + "/" + n,
        class: done ? "is-done" : "",
        "aria-label": "Problem " + n + (done ? ", complete" : "")
      }, String(n)));
    });
    section.append(list);
    if (!locked) {
      const next = set.findIndex((_, i) => !isProblemSolved(problemKey(id, diff, i + 1))) + 1;
      const startN = next > 0 ? next : 1;
      const row = el("div", { class: "btn-row" });
      row.append(el("a", { class: "btn", href: "#/play/" + id + "/" + diff + "/" + startN }, solved === set.length ? "Review" : (solved ? "Continue" : "Start")));
      if (solved === set.length) row.append(el("a", { class: "btn btn--ghost", href: levelUpHash(id, diff) }, "Level summary"));
      section.append(row);
    }
    wrap.append(section);
  });
  wrap.append(el("a", { class: "btn btn--ghost", href: "#/learn" }, "All lessons"));
  return wrap;
}

function viewPlay(law, diff, n) {
  if (law === 1 && !law1Unlocked()) return lawLockedView(1);
  if (law === 2 && !law2Unlocked()) return lawLockedView(2);
  if (law === 3 && !law3Unlocked()) return lawLockedView(3);
  if (!lawIntroSeen(law)) return viewLaw(law);
  if (!diffUnlocked(law, diff) || !problemUnlocked(law, diff, n)) {
    return el("div", { class: "wrap card" }, el("h1", {}, "Locked"),
      el("p", {}, "Finish the previous problem before you open this one."),
      el("a", { class: "btn", href: "#/law/" + law }, "Back to levels"));
  }
  const set = getLawProblems(law, diff);
  if (!set || n < 1 || n > set.length) return el("div", { class: "wrap card" }, el("a", { href: "#/law/" + law }, "Back"));
  const model = set[n - 1];
  const key = problemKey(law, diff, n);
  const wrap = el("div", { class: "wrap play-fbd" });
  const head = el("div", { class: "play-head" });
  const title = el("div", { class: "play-head__copy" },
    el("p", { class: "kicker" }, (LAW_INTRO[law] ? LAW_INTRO[law].kicker : "Lesson") + " · " + LEVEL_LABEL[diff]),
    el("p", { class: "play-head__count" }, "Problem " + n + " of " + set.length)
  );
  const tools = el("div", { class: "play-head__tools" });
  const dots = el("div", { class: "problem-dots" });
  set.forEach((_, i) => {
    const num = i + 1;
    const done = isProblemSolved(problemKey(law, diff, num));
    const open = problemUnlocked(law, diff, num);
    const cls = (num === n ? "is-on" : "") + (done ? " is-done" : "");
    if (!open) {
      dots.append(el("button", { type: "button", class: cls, disabled: true }, String(num)));
      return;
    }
    dots.append(el("a", { href: "#/play/" + law + "/" + diff + "/" + num, class: cls }, String(num)));
  });
  tools.append(dots);
  const timerId = "play." + key;
  const askKey = key + ".ask";
  const timeLimit = TIME_LIMIT[diff] || 120;
  function onPlayExpire() {
    wrap.classList.add("is-timed-out");
    feedbackWrong();
    showTimeUpPopup(() => {
      clearTimerStore(pageTimerId || timerId);
      pageTimerId = null;
      route();
    });
  }
  if (!isProblemSolved(key)) startPageTimer(timerId, timeLimit, onPlayExpire);
  head.append(title, tools);
  const card = el("section", { class: "card play-fbd-card" });
  function win() {
    const wasTierComplete = tierComplete(law, diff);
    markProblemSolved(key);
    wrap.classList.add("is-play-solved");
    stopPageTimer(true);
    refreshProgressUI();
    const justFinishedTier = n >= set.length && tierComplete(law, diff) && !wasTierComplete;
    if (justFinishedTier) {
      feedbackRight();
      location.hash = levelUpHash(law, diff);
      route();
      return;
    }
    appendFbdWin(card, levelWinMessage(law, diff, n), playSuccessActions(law, diff, n), model.why);
  }
  mountFbd(card, model, () => {}, {
    simple: true,
    showAxes: true,
    focusCanvas: true,
    rejectExtra: true,
    trayIds: TRAY_IDS,
    hideFeedbackWhenSolved: true,
    onCorrect: (info) => {
      if (info && info.skipped) {
        if (model.ask) store.setFlag(askKey);
        win();
        return;
      }
      if (model.ask) {
        startPageTimer(timerId + ".ask", timeLimit, onPlayExpire, true);
        const askBox = el("div", { class: "fbd-ask" });
        card.append(askBox);
        mountNumber(askBox, fbdAskProblem(model, askKey), win);
        revealResult(askBox);
        return;
      }
      win();
    }
  });
  wrap.append(head, card);
  window.scrollTo(0, 0);
  return wrap;
}

function mountAccelCheck(host, onOk) {
  const fb = el("p", { class: "feedback", "aria-live": "polite" });
  const input = el("input", { type: "text", inputmode: "decimal", "aria-label": "Acceleration in meters per second squared" });
  let tries = 0;
  const form = el("form", { class: "accel-form" },
    el("p", {}, "The diagram is correct. What is the acceleration down the incline?"),
    el("div", { class: "field" }, input, el("span", { class: "unit" }, "m/s²")),
    el("button", { class: "btn", type: "submit" }, "Check acceleration"),
    fb
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = parseNum(input.value);
    if (Number.isFinite(value) && Math.abs(value - 4.9) <= 0.15) {
      fb.className = "feedback is-right";
      fb.textContent = "a = g sin 30° = 4.9 m/s².";
      input.disabled = true;
      form.querySelector("button").disabled = true;
      onOk();
      return;
    }
    tries += 1;
    fb.className = "feedback is-wrong";
    fb.textContent = tries >= 2 ? "Use a = g sin 30°." : "That is not the acceleration down the incline.";
  });
  const skipAccel = adminSkipButton("Skip acceleration", () => {
    fb.className = "feedback is-right";
    fb.textContent = "Skipped in admin mode.";
    input.disabled = true;
    form.querySelector("button").disabled = true;
    onOk();
  });
  if (skipAccel) form.append(skipAccel);
  host.append(form);
}

function viewChallenge() {
  if (!challengeUnlocked()) {
    return el("div", { class: "wrap card" },
      el("h1", {}, "Locked"),
      el("p", {}, "Finish Difficult of Newton’s Third Law before you open the challenge."),
      el("a", { class: "btn", href: "#/law/3" }, "Newton’s Third Law"));
  }
  if (challengeAllDone() && !store.data.challenge) {
    store.data.challenge = 1;
    store.save();
  }
  const review = currentRoute().item || 0;
  const playingReview = review >= 1 && review <= CHALLENGE_POOL.length;
  if (!playingReview && challengeAllDone()) {
    const reviews = el("div", { class: "btn-row" });
    CHALLENGE_POOL.forEach((item, i) => {
      reviews.append(el("a", { class: "btn btn--ghost", href: "#/challenge/" + (i + 1) }, "Review " + (i + 1)));
    });
    reviews.append(el("a", { class: "btn", href: "#/final" }, "Newton’s orchard"));
    return el("div", { class: "wrap card" },
      el("h1", {}, "Challenge complete"),
      el("p", {}, "You finished all five mixed problems. You chose the right law for each one."),
      reviews
    );
  }
  const cur = playingReview ? review - 1 : Math.max(0, CHALLENGE_POOL.findIndex((c) => !store.flag("ch." + c.key)));
  const item = CHALLENGE_POOL[cur];
  const wrap = el("div", { class: "wrap play-fbd challenge-wrap" });
  const head = el("div", { class: "play-head" });
  const title = el("div", { class: "play-head__copy" },
    el("p", { class: "kicker" }, "Challenge"),
    el("p", { class: "play-head__count" }, "Problem " + (cur + 1) + " of " + CHALLENGE_POOL.length)
  );
  const tools = el("div", { class: "play-head__tools" });
  const timerId = "ch." + item.key;
  const askKey = "ch.ask." + item.key;
  function onChallengeExpire() {
    wrap.classList.add("is-timed-out");
    feedbackWrong();
    showTimeUpPopup(() => {
      clearTimerStore(pageTimerId || timerId);
      pageTimerId = null;
      route();
    });
  }
  if (!store.flag("ch." + item.key)) startPageTimer(timerId, TIME_LIMIT.challenge, onChallengeExpire);
  head.append(title, tools);
  const card = el("section", { class: "card play-fbd-card challenge-fbd-card" });
  function finishItem() {
    store.setFlag("ch." + item.key);
    wrap.classList.add("is-play-solved");
    stopPageTimer(true);
    if (playingReview) {
      appendFbdWin(card, "Correct.", el("a", { class: "btn btn--hero", href: "#/challenge" }, "Back to the challenge"), item.model.why);
    } else if (cur >= CHALLENGE_POOL.length - 1) {
      store.data.challenge = 1;
      store.save();
      appendFbdWin(card, "Challenge complete.", el("a", { class: "btn btn--hero", href: "#/final" }, "Open Newton’s orchard", el("span", { "aria-hidden": "true" }, "→")), item.model.why);
    } else {
      const next = el("button", { class: "btn btn--hero", type: "button" }, "Continue to problem " + (cur + 2), el("span", { "aria-hidden": "true" }, "→"));
      next.addEventListener("click", () => route());
      appendFbdWin(card, "Correct. Problem " + (cur + 1) + " of " + CHALLENGE_POOL.length + " is done.", next, item.model.why);
    }
  }
  mountFbd(card, item.model, () => {}, {
    simple: true,
    showAxes: true,
    focusCanvas: true,
    rejectExtra: true,
    trayIds: TRAY_IDS,
    hideFeedbackWhenSolved: true,
    onCorrect: (info) => {
      if (info && info.skipped) {
        if (item.model.ask) store.setFlag(askKey);
        finishItem();
        return;
      }
      if (item.model.ask) {
        startPageTimer(timerId + ".ask", TIME_LIMIT.challenge, onChallengeExpire, true);
        const askBox = el("div", { class: "fbd-ask" });
        card.append(askBox);
        mountNumber(askBox, fbdAskProblem(item.model, askKey), finishItem);
        revealResult(askBox);
        return;
      }
      finishItem();
    }
  });
  wrap.append(head, card);
  window.scrollTo(0, 0);
  return wrap;
}

let pageController = null;
let pageTimerStop = null;
let pageTimerId = null;

function stopPageTimer(clear) {
  if (pageTimerId && clear) clearTimerStore(pageTimerId);
  if (pageTimerStop) {
    pageTimerStop(!!clear);
    pageTimerStop = null;
  } else {
    hideTimerHost();
  }
  pageTimerId = null;
}

function startPageTimer(timerId, seconds, onExpire, reset) {
  if (pageTimerStop) {
    pageTimerStop(false);
    pageTimerStop = null;
  } else {
    hideTimerHost();
  }
  if (reset) {
    if (pageTimerId) clearTimerStore(pageTimerId);
    clearTimerStore(timerId);
  }
  pageTimerId = timerId;
  pageTimerStop = mountTimer(timerId, seconds, onExpire);
}

function abandonPageTimer() {
  stopPageTimer(true);
}

function refreshProgressUI() {
  paintChrome(currentRoute());
  if (pageController) pageController.refresh();
}

function progressDone() {
  let n = tutorialDone() ? 1 : 0;
  eachLawProblem((law, diff, i) => {
    if (isProblemSolved(problemKey(law, diff, i))) n += 1;
  });
  CHALLENGE_POOL.forEach((item) => {
    if (store.flag("ch." + item.key)) n += 1;
  });
  return n;
}

function progressTotal() {
  let n = 1;
  eachLawProblem(() => { n += 1; });
  return n + CHALLENGE_POOL.length;
}

function viewHome() {
  return el("div", { class: "wrap home-simple" },
    el("section", { class: "hero" },
      el("div", { class: "hero__copy" },
        el("p", { class: "kicker" }, "Forces & motion"),
        el("h1", {}, APP_NAME),
        el("p", { class: "lede" }, "Learn to draw free-body diagrams, then work through Newton’s three laws—from the tutorial to the timed challenge."),
        el("a", { class: "btn btn--hero", href: continueHash() }, courseComplete() ? "Newton’s orchard" : (tutorialDone() ? "Continue" : "Start"), el("span", { "aria-hidden": "true" }, "→"))
      ),
      heroArt()
    ),
    el("div", { class: "section-title" },
      el("div", {}, el("p", { class: "kicker" }, "Course"), el("h2", {}, "Lessons")),
      el("a", { href: "#/learn" }, "All")
    ),
    el("div", { class: "topic-grid" }, TOPICS.map(topicCard))
  );
}

const SESSION_ICON = ["↗", "Σ", "⇄", "✦", "∆"];
const SESSION_TAG = ["Inertia", "F = ma", "Action · reaction", "Diagram studio", "Solve it"];

function trailStop(session, isHere) {
  const id = session.id;
  const locked = !isUnlocked(id);
  const done = isComplete(id);
  const pct = sessionPercent(id);
  const state = locked ? "is-locked" : (done ? "is-done" : (isHere ? "is-here" : "is-open"));
  const stop = el("li", { class: "stop tone-" + id + " " + state });
  stop.append(el("span", { class: "stop__node", "aria-hidden": "true" }, locked ? "🔒" : (done ? "✓" : SESSION_ICON[id - 1])));
  const card = el(locked ? "div" : "a", { class: "stop__card", href: locked ? null : "#/session/" + id });
  const band = el("div", { class: "stop__band" },
    el("span", { class: "stop__no" }, "Session " + String(id).padStart(2, "0")),
    el("span", { class: "stop__tag" }, SESSION_TAG[id - 1])
  );
  if (isHere) band.append(el("span", { class: "stop__here" }, "You are here"));
  card.append(band);
  card.append(el("h3", {}, session.title));
  card.append(el("p", { class: "stop__blurb" }, locked ? "Finish Session " + (id - 1) + " to unlock." : session.blurb));
  const steps = el("ol", { class: "stop__steps", "aria-label": "Parts" });
  FLOW[id].forEach((item) => {
    const ok = store.task(id, item[2]) >= 1;
    steps.append(el("li", { class: ok ? "is-ok" : "" }, item[1].replace(/^\d+\s·\s/, "")));
  });
  card.append(steps);
  const foot = el("div", { class: "stop__foot" });
  const bar = el("div", { class: "stop__bar" });
  const fill = el("i");
  fill.style.width = (locked ? 0 : pct) + "%";
  bar.append(fill);
  foot.append(bar, el("strong", {}, locked ? "Locked" : pct + "%"));
  if (!locked) foot.append(el("span", { class: "stop__go" }, done ? "Replay" : (pct ? "Resume" : "Start"), el("b", { "aria-hidden": "true" }, "→")));
  card.append(foot);
  stop.append(card);
  return stop;
}

function viewSessions() {
  return viewLearn();
}

function rankFor(pct) {
  if (isFinalComplete()) return ["Physicist", "Every law and every diagram, solved. The lab is yours."];
  if (pct >= 100) return ["Cleared", "All five sessions done. The final challenge is open."];
  if (pct >= 80) return ["Unstoppable", "Almost there. One more push and the path is clear."];
  if (pct >= 50) return ["In motion", "Halfway charged. Net force is on your side."];
  if (pct >= 20) return ["Accelerating", "The score is climbing. Keep the same direction."];
  if (pct > 0) return ["First push", "You started it. A body in motion stays in motion."];
  return ["At rest", "Start Session 1. Nothing changes until a net force acts."];
}

function viewProgress() {
  const done = progressDone();
  const total = progressTotal();
  const pct = Math.round(done / total * 100);
  const reset = el("button", { class: "btn btn--ghost", type: "button" }, "Reset progress");
  reset.addEventListener("click", openReset);
  const ring = el("div", { class: "score__ring", style: "--pct:" + pct });
  ring.append(el("div", { class: "score__core" }, el("strong", {}, String(pct)), el("span", {}, "percent")));
  return el("div", { class: "wrap progress-page" },
    el("section", { class: "score" },
      ring,
      el("div", { class: "score__copy" },
        el("p", { class: "kicker" }, "Your progress"),
        el("h1", {}, done ? done + " of " + total + " lessons complete" : "Ready to begin"),
        el("p", { class: "lede" }, "Tutorial, three laws with easy through difficult levels, then the mixed challenge."),
        el("a", { class: "btn btn--hero", href: continueHash() }, courseComplete() ? "Newton’s orchard" : "Continue", el("span", { "aria-hidden": "true" }, "→"))
      )
    ),
    el("div", { class: "topic-grid" }, TOPICS.map(topicCard)),
    buildAdminPanel(),
    el("div", { class: "btn-row" }, reset)
  );
}

function openReset() {
  const back = el("div", { class: "modal-back" });
  const dialog = el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "reset-title" });
  const cancel = el("button", { class: "btn btn--ghost", type: "button" }, "Cancel");
  const erase = el("button", { class: "btn", type: "button" }, "Erase progress");
  cancel.addEventListener("click", () => back.remove());
  erase.addEventListener("click", () => { back.remove(); store.reset(); });
  dialog.append(
    el("h2", { id: "reset-title" }, "Erase saved progress?"),
    el("p", {}, "This erases the free-body steps, every level, and the challenge on this device. It cannot be undone."),
    el("div", { class: "btn-row" }, cancel, erase)
  );
  back.append(dialog);
  document.body.append(back);
  cancel.focus();
}

function donePanel(id) {
  const host = el("div", { class: "card done-copy" });
  const burst = el("div", { class: "confetti", "aria-hidden": "true" });
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const colors = ["#0f6e6a", "#c05622", "#31457a", "#2a6b45", "#a67c2d"];
    for (let i = 0; i < 16; i++) {
      const bit = el("i");
      bit.style.left = (6 + i * 6) + "%";
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = (i * 0.04) + "s";
      burst.append(bit);
    }
  }
  const next = id < 5 ? "#/session/" + (id + 1) : "#/final";
  const label = id < 5 ? "Continue to Session " + (id + 1) + " →" : "Start the final challenge →";
  host.append(
    burst,
    el("div", { class: "stamp-wrap" }, el("div", { class: "stamp" }, "Complete")),
    el("h2", {}, "Session " + id + " Complete!"),
    el("p", {}, id === 5 ? "The diagram and the laws now work as one tool." : "That session is saved on this device."),
    el("a", { class: "btn", href: next }, label)
  );
  return host;
}

function viewSession(id) {
  const session = SESSIONS[id - 1];
  if (!session || !isUnlocked(id)) {
    return el("div", { class: "wrap card" },
      el("h1", {}, "Locked"),
      el("p", {}, "Finish the previous session to open this one."),
      el("a", { class: "btn", href: "#/sessions" }, "Back to sessions")
    );
  }

  const flow = FLOW[id];
  const sceneNav = { active: false, index: 0, total: 0, stepReady: false, allDone: false, goNext() {}, goPrev() {} };
  const panels = {};
  let current = flow[0][0];
  const chipRow = el("div", { class: "chips" });
  const stack = el("div");
  const footer = el("div", { class: "btn-row" });

  function taskOf(sectionId) {
    const found = flow.find((item) => item[0] === sectionId);
    return found ? found[2] : sectionId;
  }

  function canOpen(index) {
    if (index === 0) return true;
    const previous = flow[index - 1];
    return store.task(id, previous[2]) >= 1;
  }

  function paintChips() {
    chipRow.replaceChildren();
    flow.forEach((item, index) => {
      const open = canOpen(index);
      const button = el("button", { class: "chip-nav" + (item[0] === current ? " is-on" : ""), type: "button" });
      button.disabled = !open;
      const dot = el("span", { class: "dot" + (store.task(id, item[2]) >= 1 ? " is-done" : ""), "data-task-dot": item[2] });
      button.append(dot, item[1]);
      button.addEventListener("click", () => setSection(item[0]));
      chipRow.append(button);
    });
    if (isComplete(id)) {
      const done = el("button", { class: "chip-nav" + (current === "done" ? " is-on" : ""), type: "button" }, "Finish");
      done.addEventListener("click", () => setSection("done"));
      chipRow.append(done);
    }
    requestAnimationFrame(slideChip);
  }

  function slideChip() {
    const on = chipRow.querySelector(".chip-nav.is-on");
    if (!on || !chipRow.isConnected) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = on.offsetLeft - (chipRow.clientWidth - on.offsetWidth) / 2;
    chipRow.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
  }

  function advanceAfterSkip(index, task) {
    skipMark(id, task);
    if (isComplete(id)) setSection("done");
    else if (flow[index + 1]) setSection(flow[index + 1][0]);
    else setSection(current);
  }

  function appendAdminSkip(index, task) {
    const btn = adminSkipButton("Skip step", () => advanceAfterSkip(index, task));
    if (btn) footer.append(btn);
  }

  function paintFooter() {
    footer.replaceChildren();
    if (current === "done") return;
    const index = flow.findIndex((item) => item[0] === current);
    const task = taskOf(current);
    if (current === "explore" && sceneNav.active) {
      const back = el("button", { class: "btn btn--ghost", type: "button" }, "Back");
      if (sceneNav.index > 0) back.addEventListener("click", () => sceneNav.goPrev());
      else back.addEventListener("click", () => setSection(flow[index - 1][0]));
      footer.append(back);
      const onLast = sceneNav.index >= sceneNav.total - 1;
      const next = el("button", { class: "btn", type: "button" }, "Continue");
      const leave = onLast && sceneNav.allDone;
      next.disabled = !(leave || (sceneNav.stepReady && !onLast));
      if (next.disabled) next.title = "Answer this situation to continue";
      next.addEventListener("click", () => {
        if (leave) {
          if (flow[index + 1]) setSection(flow[index + 1][0]);
          return;
        }
        sceneNav.goNext();
      });
      footer.append(next);
      if (next.disabled) footer.append(el("p", { class: "quiet foot-note" }, "Answer this situation, then press Continue."));
      appendAdminSkip(index, task);
      return;
    }
    if (index > 0) {
      const back = el("button", { class: "btn btn--ghost", type: "button" }, "Back");
      back.addEventListener("click", () => setSection(flow[index - 1][0]));
      footer.append(back);
    }
    const ready = store.task(id, task) >= 1;
    if (current === "learn" || current === "read") {
      const next = el("button", { class: "btn", type: "button" }, "Continue");
      next.addEventListener("click", () => {
        store.setTask(id, task, 1);
        const following = flow[index + 1];
        setSection(isComplete(id) ? "done" : (following ? following[0] : current));
      });
      footer.append(next);
      appendAdminSkip(index, task);
      return;
    }
    const next = el("button", { class: "btn", type: "button" }, index === flow.length - 1 ? "Finish session" : "Continue");
    next.disabled = !ready;
    if (!ready) next.title = "Finish this part to continue";
    next.addEventListener("click", () => {
      if (store.task(id, task) < 1) return;
      if (isComplete(id)) setSection("done");
      else if (flow[index + 1]) setSection(flow[index + 1][0]);
    });
    footer.append(next);
    appendAdminSkip(index, task);
  }

  function setSection(name) {
    current = name;
    if (id === 5 && name === "check" && panels.check) {
      const fresh = finalChecklist();
      panels.check.replaceChildren(...fresh.childNodes);
      syncFiveCheck();
    }
    Object.keys(panels).forEach((key) => { panels[key].hidden = key !== name; });
    const done = stack.querySelector("[data-done]");
    if (done) done.hidden = name !== "done";
    paintChips();
    paintFooter();
    window.scrollTo(0, 0);
  }

  function watch(task, value) {
    if (value >= 1) store.setTask(id, task, 1);
    else store.putTask(id, task, value);
    if (isComplete(id) && current === flow[flow.length - 1][0]) setSection("done");
    else {
      paintChips();
      paintFooter();
    }
  }

  flow.forEach((item) => {
    const panel = el("section", { class: "card" });
    panel.hidden = true;
    const task = item[2];
    if (item[0] === "learn") {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, session.title), learnCopy(id));
    } else if (item[0] === "explore") {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "Explore"));
      panel.append(explorePanel(id, (value) => watch(task, value), sceneNav));
    } else if (item[0] === "check" || item[0] === "checkpoint") {
      const bank = quizBank(item[0] === "checkpoint" ? 2 : id);
      const need = passNeed(bank.length);
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, item[0] === "checkpoint" ? "Checkpoint" : "Check your understanding"));
      if (item[0] === "checkpoint") panel.append(el("p", {}, "Short quiz before the next session. The pass mark keeps the second law usable, not just familiar."));
      mountQuiz(panel, bank, need, (score, total, passed) => recordQuiz(id, task, score, total, passed));
    } else if (item[0] === "challenge") {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "Quick challenge"));
      if (id === 1) {
        panel.append(el("p", {}, "A soccer ball is rolling across the grass. It slows down and stops."));
        mountFormative(panel, {
          key: "s1ch",
          q: "What force is causing the change in motion?",
          choices: ["Inertia", "Friction", "A forward force that runs out", "Gravity pulling the ball backward"],
          answer: 1,
          hint: "Something must act against the motion. Inertia is not a force.",
          why: "Friction from the grass acts opposite the motion, so the net force is no longer zero and the ball slows."
        }, () => watch("challenge", 1));
      } else {
        mountFormative(panel, {
          key: "s2ch",
          q: "What happens to acceleration if the force increases while mass stays the same?",
          choices: ["It increases", "It decreases", "It stays the same", "It becomes zero"],
          answer: 0,
          hint: "Look at a = F / m and change only F.",
          why: "Acceleration increases. In a = F / m, a larger force gives a larger acceleration when mass is constant."
        }, () => watch("challenge", 1));
      }
    } else if (item[0] === "practice" && id === 2) {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "Practice"), el("p", {}, "Use F = ma. Give the magnitude. Units are shown beside the box."));
      mountProblemSet(panel, [
        { key: "s2p1", q: "A 5-kg box is pushed with a net force of 20 N. What is its acceleration?", answer: 4, unit: "m/s²", hint: "You know the force and the mass, and want acceleration. Rearrange F = ma to a = F / m.", why: "a = 20 / 5 = 4 m/s².",
          explain: "Start from F = ma. Divide both sides by m to get a = F / m. Then a = 20 N ÷ 5 kg = 4 m/s².",
          mistakes: [
            { value: 100, msg: "You multiplied 20 × 5. That is F = ma used backwards: multiplying mass by acceleration gives force. Here you need acceleration, so divide the force by the mass." },
            { value: 0.25, msg: "You divided 5 ÷ 20, mass by force. Flip it: the force goes on top, a = F / m." }
          ] },
        { key: "s2p2", q: "A 10-kg wagon is pulled with a net force of 50 N. What is its acceleration?", answer: 5, unit: "m/s²", hint: "Acceleration = net force ÷ mass. Ask: how many newtons does each kilogram get?", why: "a = 50 / 10 = 5 m/s².",
          explain: "a = F / m = 50 N ÷ 10 kg = 5 m/s². Each kilogram of the wagon gets 5 N of the pull.",
          mistakes: [
            { value: 500, msg: "You multiplied 50 × 10. Multiplying mass by acceleration gives force, but the force is already given. Divide the force by the mass instead." },
            { value: 0.2, msg: "You divided 10 ÷ 50, mass by force. Put the force on top: a = F / m." },
            { value: 40, msg: "You subtracted 50 − 10. Newtons and kilograms are different units, so they can't be subtracted. Use a = F / m." }
          ] },
        { key: "s2p3", q: "A 2-kg cart accelerates at 6 m/s². What is the net force?", answer: 12, unit: "N", hint: "This time you want the force. F = ma means multiply the mass by the acceleration.", why: "F = 2 × 6 = 12 N.",
          explain: "Force is the unknown, so use F = ma directly: F = 2 kg × 6 m/s² = 12 N.",
          mistakes: [
            { value: 3, msg: "You divided 6 ÷ 2. Dividing is for finding acceleration or mass. When force is the unknown, F = ma tells you to multiply." },
            { value: 0.333, msg: "You divided 2 ÷ 6. When force is the unknown, multiply mass by acceleration: F = ma." },
            { value: 8, msg: "You added 2 + 6. Mass and acceleration combine by multiplying, not adding: F = m × a." }
          ] },
        { key: "s2p4", q: "A net force of 36 N produces an acceleration of 4 m/s². What is the mass?", answer: 9, unit: "kg", hint: "Mass is the unknown. Rearrange F = ma by dividing both sides by a.", why: "m = 36 / 4 = 9 kg.",
          explain: "Start from F = ma. Divide both sides by a to get m = F / a. Then m = 36 N ÷ 4 m/s² = 9 kg.",
          mistakes: [
            { value: 144, msg: "You multiplied 36 × 4. Multiplying mass by acceleration gives force, but the force is already 36 N. To find mass, divide the force by the acceleration." },
            { value: 0.111, msg: "You divided 4 ÷ 36, acceleration by force. The force goes on top: m = F / a." },
            { value: 32, msg: "You subtracted 36 − 4. Newtons and m/s² are different units, so they can't be subtracted. Use m = F / a." }
          ] }
      ], (value) => watch("practice", value));
    } else if (item[0] === "match") {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "Pair-match activity"));
      panel.append(el("p", {}, "Match the force on object A with the force on object B."));
      mountPairs(panel, () => watch("match", 1));
    } else if (item[0] === "error") {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "Error check"));
      panel.append(el("blockquote", { class: "quote" }, "“The action force is bigger than the reaction force.”"));
      mountFormative(panel, {
        key: "s3err",
        q: "Is that statement correct or incorrect?",
        choices: ["Correct", "Incorrect"],
        answer: 1,
        hint: "Compare the sizes in a third-law pair.",
        why: "The statement is incorrect. The forces are equal in size."
      }, () => {
        if (store.flag("s3why")) {
          watch("error", 1);
          return;
        }
        const extra = el("div");
        panel.append(extra);
        mountFormative(extra, {
          key: "s3why",
          q: "Why is that statement wrong?",
          choices: ["The action happens first, so it is stronger", "The forces are equal in size and opposite in direction, and they act on different objects", "The reaction is bigger whenever the second object is heavier"],
          answer: 1,
          hint: "Check both the sizes and which object each force acts on.",
          why: "Action and reaction are equal, opposite, and on different objects. Neither one is the “bigger” force."
        }, () => watch("error", 1));
      });
    } else if (item[0] === "build") {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "FBD Builder"));
      mountFbd(panel, {
        situation: "A box is pushed to the right on a rough surface.",
        object: "Box",
        objects: ["Box", "Table", "Hand", "Floor"],
        catalog: ["gravity", "normal", "applied", "friction", "tension", "motion"],
        forces: [
          { id: "gravity", dir: "down" },
          { id: "normal", dir: "up" },
          { id: "applied", dir: "right" },
          { id: "friction", dir: "left" }
        ],
        eq: [["gravity", "normal"]]
      }, (value) => watch("build", value));
    } else if (item[0] === "practice" && id === 4) {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "Practice build"), el("p", {}, "New situation, same moves: isolate the object, add its forces, aim and size each arrow, then check."));
      mountFbd(panel, {
        situation: "A book rests on a table.",
        object: "Book",
        objects: ["Book", "Table", "Floor", "Earth"],
        catalog: ["gravity", "normal", "applied", "friction", "tension", "motion"],
        forces: [
          { id: "gravity", dir: "down" },
          { id: "normal", dir: "up" }
        ],
        eq: [["gravity", "normal"]]
      }, (value) => watch("practice", value));
    } else if (item[0] === "read") {
      panel.append(sessionFiveRead(() => watch("read", 1)));
    } else if (item[0] === "identify") {
      panel.append(sessionFiveIdentify(() => watch("identify", 1), () => {
        if (store.task(5, "identify") >= 1) watch("identify", 0);
      }));
    } else if (item[0] === "construct") {
      panel.append(el("p", { class: "kicker" }, "Step 3 — Construct"), el("h2", {}, "Draw the diagram"));
      mountFbd(panel, {
        situation: "A 10-kg box is pushed to the right with a force of 30 N. Friction acts against the motion with a force of 10 N. The floor is flat and rough.",
        object: "Box",
        objects: ["Box", "Floor", "Person"],
        catalog: ["gravity", "normal", "applied", "friction", "tension", "motion"],
        forces: [
          { id: "gravity", dir: "down" },
          { id: "normal", dir: "up" },
          { id: "applied", dir: "right" },
          { id: "friction", dir: "left" }
        ],
        eq: [["gravity", "normal"]],
        gt: [["applied", "friction", "30 N against 10 N"]]
      }, (value) => watch("construct", value));
    } else if (item[0] === "analyze") {
      panel.append(el("p", { class: "kicker" }, "Step 4 — Analyze"), el("h2", {}, "What is the net force?"));
      panel.append(el("p", {}, "Vertical forces balance on the flat floor. Use the horizontal forces only: 30 N to the right and 10 N to the left."));
      mountNumber(panel, {
        key: "s5net",
        q: "What is the net force on the box?",
        answer: 20,
        unit: "N",
        dir: "right",
        hint: "Subtract the force that opposes the push.",
        why: "Fnet = 30 N − 10 N = 20 N to the right."
      }, () => watch("analyze", 1));
    } else if (item[0] === "apply") {
      panel.append(el("p", { class: "kicker" }, "Step 5 — Apply Newton's law"), el("h2", {}, "Solve"));
      const eq = el("div");
      panel.append(eq);
      mountFormative(eq, {
        key: "s5eq",
        q: "Which equation matches this problem?",
        choices: ["a = Fnet / m", "a = m / Fnet", "a = Fnet × m", "a = m − Fnet"],
        answer: 0,
        hint: "Start from F = ma and solve for a.",
        why: "a = Fnet / m. The net force is 20 N and the mass is 10 kg."
      }, () => {
        const num = el("div");
        panel.append(num);
        mountNumber(num, {
          key: "s5a",
          q: "What is the acceleration of the box?",
          answer: 2,
          unit: "m/s²",
          dir: "right",
          hint: "Divide the 20 N net force by 10 kg.",
          why: "a = 20 / 10 = 2 m/s² to the right."
        }, () => watch("apply", 1));
      });
    } else if (item[0] === "check") {
      panel.append(finalChecklist(id));
    }
    panels[item[0]] = panel;
    stack.append(panel);
  });

  const done = el("div", { "data-done": "1" });
  done.hidden = true;
  done.append(donePanel(id));
  stack.append(done);
  panels.done = done;

  pageController = {
    refresh() {
      paintChips();
      paintFooter();
      if (current === "check" && id === 5) {
        const fresh = finalChecklist(id);
        panels.check.replaceChildren(...fresh.childNodes);
      }
    }
  };

  const pending = flow.find((item, index) => canOpen(index) && store.task(id, item[2]) < 1);
  const start = isComplete(id) ? "done" : (pending ? pending[0] : flow[0][0]);

  const page = el("div", { class: "wrap session-page" },
    el("p", { class: "kicker" }, "Session " + id + " of 5"),
    el("h1", {}, session.title),
    id === 5 ? problemStrip() : null,
    chipRow,
    stack,
    footer
  );
  setSection(start);
  return page;
}

function problemStrip() {
  return el("aside", { class: "recap" },
    el("p", {}, el("strong", {}, "Problem. "), "A 10-kg box is pushed to the right with a force of 30 N. Friction acts against the motion with a force of 10 N. The floor is flat and rough.")
  );
}

function sessionFiveRead(onReady) {
  const box = el("div");
  const facts = [
    ["mass", "Mass is 10 kg"],
    ["push", "The push is 30 N to the right"],
    ["drag", "Friction is 10 N to the left"]
  ];
  const seen = new Set(facts.filter((fact) => store.flag("s5read-" + fact[0])).map((fact) => fact[0]));
  box.append(el("p", { class: "kicker" }, "Step 1 — Read"), el("h2", {}, "Mark the facts"), el("p", {}, "Tap each fact hidden in the problem. All three must be marked."));
  facts.forEach((fact) => {
    const button = el("button", { class: "fact" + (seen.has(fact[0]) ? " is-on" : ""), type: "button" }, fact[1]);
    button.addEventListener("click", () => {
      seen.add(fact[0]);
      store.setFlag("s5read-" + fact[0]);
      button.classList.add("is-on");
      if (seen.size === facts.length) onReady();
    });
    box.append(button);
  });
  if (seen.size === facts.length) onReady();
  return box;
}

function sessionFiveIdentify(onPass, onEdit) {
  const box = el("div");
  box.append(el("p", { class: "kicker" }, "Step 2 — Identify"), el("h2", {}, "Object and forces"));
  let object = null;
  const forces = new Set();
  const needed = ["gravity", "normal", "applied", "friction"];
  const fb = el("p", { class: "feedback", "aria-live": "polite" });
  box.append(el("h3", {}, "Object"));
  ["Box", "Floor", "Person"].forEach((name) => {
    const button = el("button", { class: "choice", type: "button" }, name);
    button.addEventListener("click", () => {
      object = name;
      box.querySelectorAll(".choice").forEach((node) => node.classList.toggle("is-right", node === button));
      onEdit();
    });
    box.append(button);
  });
  box.append(el("h3", {}, "Forces on that object"));
  const tray = el("div", { class: "force-tray" });
  ["gravity", "normal", "applied", "friction", "tension", "motion"].forEach((id) => {
    const button = el("button", { class: "force-chip", type: "button" }, FORCE[id].label);
    button.addEventListener("click", () => {
      if (forces.has(id)) forces.delete(id);
      else forces.add(id);
      button.classList.toggle("is-on");
      onEdit();
    });
    tray.append(button);
  });
  const check = el("button", { class: "btn", type: "button" }, "Check identification");
  check.addEventListener("click", () => {
    const missing = needed.filter((id) => !forces.has(id));
    const extra = [...forces].filter((id) => !needed.includes(id));
    if (object !== "Box") {
      fb.className = "feedback is-wrong";
      fb.textContent = "The object is the box.";
      onEdit();
      return;
    }
    if (missing.length || extra.length) {
      fb.className = "feedback is-wrong";
      fb.textContent = missing.length ? "Missing " + FORCE[missing[0]].label.toLowerCase() + "." : FORCE[extra[0]].label + " does not act on the box here.";
      onEdit();
      return;
    }
    fb.className = "feedback is-right";
    fb.textContent = "Correct. Gravity, normal force, applied force, and friction.";
    onPass();
  });
  box.append(tray, check, fb);
  return box;
}

function requirementState() {
  return [
    ["Correct object", store.task(5, "identify") >= 1],
    ["Correct forces", store.task(5, "identify") >= 1],
    ["Correct directions", store.task(5, "construct") >= 1],
    ["Correct FBD", store.task(5, "construct") >= 1],
    ["Correct equation", store.flag("s5eq")],
    ["Correct answer", store.flag("s5net") && store.flag("s5a")]
  ];
}

function finalChecklist() {
  const box = el("div");
  box.append(el("p", { class: "kicker" }, "Step 6 — Final check"), el("h2", {}, "Does the solution hold?"));
  const items = requirementState();
  const list = el("ul", { class: "check-list" });
  items.forEach(([label, ok]) => {
    list.append(el("li", { class: ok ? "pass" : "fail" }, el("span", {}, label), el("strong", {}, ok ? "Pass" : "Not yet")));
  });
  const all = items.every((item) => item[1]);
  box.append(list);
  box.append(all
    ? el("p", { class: "feedback is-right" }, "Correct. Fnet = 30 N − 10 N = 20 N to the right. a = 20 N / 10 kg = 2 m/s² to the right. Vertical forces balance, so they do not change the horizontal acceleration.")
    : el("p", {}, "Go back to any open step, fix the miss, and return. This list updates from the saved steps."));
  return box;
}

function syncFiveCheck() {
  const all = requirementState().every((item) => item[1]);
  const next = all ? 1 : 0;
  if ((store.data.task[5].check || 0) === next) return;
  store.data.task[5].check = next;
  store.save();
}

function viewFinal() {
  if (!courseComplete()) {
    return el("div", { class: "wrap card" },
      el("h1", {}, "Locked"),
      el("p", {}, "Finish both challenge diagrams first. Then Newton’s orchard opens."),
      el("a", { class: "btn", href: "#/challenge" }, "Challenge")
    );
  }
  return orchardFinale();
}

function makeFinaleBurst() {
  const burst = el("div", { class: "finale__burst", "aria-hidden": "true" });
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return burst;
  const colors = ["#e8c15a", "#e23b4a", "#fff8e8", "#7ddea0", "#ffb0a4", "#f4ebd4", "#2f9a55"];
  const shapes = ["strip", "dot", "square", "apple"];
  for (let i = 0; i < 56; i++) {
    const bit = el("i", { class: "bit bit--" + shapes[i % shapes.length] });
    const seed = (i * 47) % 100;
    bit.style.setProperty("--x", (1 + (i * 17) % 98) + "%");
    bit.style.setProperty("--delay", (1.1 + (seed % 16) * 0.045).toFixed(2) + "s");
    bit.style.setProperty("--dur", (2.5 + (seed % 8) * 0.2).toFixed(2) + "s");
    bit.style.setProperty("--drift", ((seed % 2 ? 1 : -1) * (16 + seed % 48)) + "px");
    bit.style.setProperty("--spin", (seed % 2 ? 720 : -720) + "deg");
    bit.style.background = colors[i % colors.length];
    burst.append(bit);
  }
  return burst;
}

function orchardFinale() {
  let quoteIndex = 0;
  const quoteText = el("p", {}, NEWTON_QUOTES[0].text);
  const quoteCite = el("cite", {}, "Isaac Newton · " + NEWTON_QUOTES[0].cite);
  const quoteNo = el("span", { class: "newton__no" }, "1 / " + NEWTON_QUOTES.length);
  const quote = el("blockquote", { class: "newton" }, quoteText, quoteCite, quoteNo);

  function showQuote(index) {
    quoteIndex = (index + NEWTON_QUOTES.length) % NEWTON_QUOTES.length;
    const item = NEWTON_QUOTES[quoteIndex];
    quote.classList.remove("is-swap");
    void quote.offsetWidth;
    quote.classList.add("is-swap");
    quoteText.textContent = item.text;
    quoteCite.textContent = "Isaac Newton · " + item.cite;
    quoteNo.textContent = (quoteIndex + 1) + " / " + NEWTON_QUOTES.length;
  }

  const apple = el("i", { class: "tree__apple tree__apple--fall" });
  const stage = el("div", { class: "finale__stage", "aria-hidden": "true" },
    el("div", { class: "tree" },
      el("div", { class: "tree__crown" }),
      el("div", { class: "tree__crown tree__crown--side" }),
      el("div", { class: "tree__crown tree__crown--right" }),
      el("i", { class: "tree__trunk" }),
      el("i", { class: "tree__apple tree__apple--still" }),
      el("i", { class: "tree__apple tree__apple--still tree__apple--b" }),
      apple
    ),
    el("i", { class: "tree__ground" })
  );

  let burst = makeFinaleBurst();
  const page = el("div", { class: "wrap finale" });

  function replayDrop() {
    apple.classList.remove("is-drop");
    void apple.offsetWidth;
    apple.classList.add("is-drop");
    const next = makeFinaleBurst();
    burst.replaceWith(next);
    burst = next;
  }

  const dropAgain = el("button", { class: "btn btn--ghost", type: "button" }, "Drop the apple again");
  dropAgain.addEventListener("click", replayDrop);
  apple.classList.add("is-drop");

  const nextQuote = el("button", { class: "btn", type: "button" }, "Another quote");
  nextQuote.addEventListener("click", () => showQuote(quoteIndex + 1));

  requestAnimationFrame(() => { try { sfx.ok(); } catch (err) { /* audio optional */ } });

  page.append(
    burst,
    stage,
    el("p", { class: "kicker" }, "Course complete"),
    el("h1", {}, "The apple falls."),
    el("p", { class: "finale__lede" }, "You completed the course. Here is Newton in his own words."),
    quote,
    el("div", { class: "btn-row finale__actions" },
      dropAgain,
      nextQuote,
      el("a", { class: "btn btn--hero", href: "#/progress" }, "See my progress", el("span", { "aria-hidden": "true" }, "→"))
    )
  );
  return page;
}

const main = document.getElementById("main");
let routing = false;
let pendingLock = "";

function lockMessage(info) {
  if (info.name === "play" && !lawIntroSeen(info.law) && (info.law === 1 ? law1Unlocked() : info.law === 2 ? law2Unlocked() : law3Unlocked())) {
    return "";
  }
  if (info.name === "law" && info.law === 1 && !law1Unlocked()) return MSG_TUTORIAL_FIRST;
  if (info.name === "law" && info.law === 2 && !law2Unlocked()) return "Finish Difficult of Newton’s First Law first.";
  if (info.name === "law" && info.law === 3 && !law3Unlocked()) return "Finish Difficult of Newton’s Second Law first.";
  if (info.name === "play") {
    if (info.law === 1 && !law1Unlocked()) return MSG_TUTORIAL_FIRST;
    if (info.law === 2 && !law2Unlocked()) return "Finish Difficult of Newton’s First Law first.";
    if (info.law === 3 && !law3Unlocked()) return "Finish Difficult of Newton’s Second Law first.";
    if (!diffUnlocked(info.law, info.diff)) return "That level is still locked. Finish the previous level first.";
    if (!problemUnlocked(info.law, info.diff, info.index)) return "Finish the previous problem first.";
  }
  if (info.name === "challenge" && !challengeUnlocked()) return "Finish Difficult of Newton’s Third Law first.";
  if (info.name === "final" && !courseComplete()) return "Finish the challenge first. Then Newton’s orchard opens.";
  if (info.name === "levelup") {
    if (info.kind === "tutorial") return tutorialDone() ? "" : MSG_TUTORIAL_FIRST;
    if (info.law === 1 && !law1Unlocked()) return MSG_TUTORIAL_FIRST;
    if (info.law === 2 && !law2Unlocked()) return "Finish Difficult of Newton’s First Law first.";
    if (info.law === 3 && !law3Unlocked()) return "Finish Difficult of Newton’s Second Law first.";
    if (!tierComplete(info.law, info.diff)) return "Finish every problem in this level first.";
  }
  return "";
}

function showTimeUpPopup(onRetry) {
  const old = document.getElementById("timeup-popup");
  if (old) old.remove();
  const back = el("div", { id: "timeup-popup", class: "modal-back" });
  const dialog = el("div", { class: "modal", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "timeup-title" });
  const retry = el("button", { class: "btn", type: "button" }, "Try again");
  retry.addEventListener("click", () => {
    back.remove();
    onRetry();
  });
  dialog.append(
    el("h2", { id: "timeup-title" }, "Time’s up"),
    el("p", {}, "The timer ran out. Try this problem again."),
    el("div", { class: "btn-row" }, retry)
  );
  back.append(dialog);
  document.body.append(back);
  retry.focus();
  announce("Time’s up. Try again.");
}

function showLockPopup(message, stay) {
  const old = document.getElementById("lock-popup");
  if (old) old.remove();
  const back = el("div", { id: "lock-popup", class: "modal-back" });
  const dialog = el("div", { class: "modal", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "lock-title" });
  const ok = el("button", { class: "btn", type: "button" }, "OK");
  ok.addEventListener("click", () => {
    back.remove();
    if (!stay && (location.hash || "#/") !== "#/learn") location.hash = "#/learn";
  });
  back.addEventListener("click", (event) => { if (event.target === back) back.remove(); });
  dialog.append(
    el("h2", { id: "lock-title" }, "Unlock this first"),
    el("p", {}, message),
    el("div", { class: "btn-row" }, ok)
  );
  back.append(dialog);
  document.body.append(back);
  ok.focus();
}

function currentRoute() {
  const raw = (location.hash || "#/").replace(/^#/, "");
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] === "tutorial") return { name: "tutorial" };
  if (parts[0] === "learn") return { name: "learn" };
  if (parts[0] === "sessions" || parts[0] === "session") return { name: "learn" };
  if (parts[0] === "law") return { name: "law", law: Number(parts[1]) || 1 };
  if (parts[0] === "levelup") {
    if (parts[1] === "tutorial") return { name: "levelup", kind: "tutorial" };
    return { name: "levelup", law: Number(parts[1]) || 1, diff: parts[2] || "easy" };
  }
  if (parts[0] === "play") return { name: "play", law: Number(parts[1]) || 1, diff: parts[2] || "easy", index: Number(parts[3]) || 1 };
  if (parts[0] === "challenge") return { name: "challenge", item: Number(parts[1]) || 0 };
  if (parts[0] === "progress") return { name: "progress" };
  if (parts[0] === "final") return { name: "final" };
  return { name: "home" };
}

function paintChrome(route) {
  const name = route.name;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const learnOn = ["learn", "tutorial", "law", "play", "challenge", "levelup"].includes(name);
    const on = link.dataset.nav === name || (link.dataset.nav === "learn" && learnOn);
    link.classList.toggle("is-on", on);
    if (on) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.body.classList.remove("tone-1", "tone-2", "tone-3", "tone-4", "tone-5", "tone-home", "tone-progress", "tone-final", "is-play-fbd");
  if (name === "home" || name === "learn") document.body.classList.add("tone-home");
  else if (name === "progress") document.body.classList.add("tone-progress");
  else if (name === "session") document.body.classList.add("tone-" + route.session);
  else if (name === "law") document.body.classList.add("tone-" + route.law);
  else if (name === "play") {
    document.body.classList.add("tone-" + route.law);
    document.body.classList.add("is-play-fbd");
  }
  else if (name === "tutorial") document.body.classList.add("tone-4");
  else if (name === "challenge") {
    document.body.classList.add("tone-5");
    document.body.classList.add("is-play-fbd");
  }
  else if (name === "final") document.body.classList.add("tone-final");
  else if (name === "levelup") document.body.classList.add(route.kind === "tutorial" ? "tone-4" : "tone-" + route.law);
  const titles = { home: APP_NAME + " · Home", learn: APP_NAME + " · Lessons", tutorial: APP_NAME + " · Tutorial", progress: APP_NAME + " · Progress", challenge: APP_NAME + " · Challenge", final: APP_NAME + " · Newton’s orchard", levelup: APP_NAME + " · Level up" };
  if (name === "law") document.title = (LAW_INTRO[route.law] ? LAW_INTRO[route.law].title : "Lesson") + " · " + APP_NAME;
  else if (name === "play") document.title = "Practice · " + APP_NAME;
  else document.title = titles[name] || APP_NAME;
  const crumb = document.getElementById("crumb");
  const lawCrumb = route.law && LAW_INTRO[route.law] ? LAW_INTRO[route.law].title : "Lesson";
  const crumbs = { home: "Home", learn: "Lessons", tutorial: "Tutorial", law: lawCrumb, play: "Practice", challenge: "Challenge", progress: "Progress", final: "Orchard", levelup: "Level up" };
  crumb.textContent = crumbs[name] || crumbs.home;
  paintSidebar(name);
  paintRail(route);
  paintAdminTopbar();
}

function paintAdminTopbar() {
  const old = document.getElementById("admin-top");
  if (old) old.remove();
  if (!ADMIN) return;
  const on = adminEnabled();
  const btn = el("button", {
    id: "admin-top",
    class: "admin-top" + (on ? " is-on" : ""),
    type: "button",
    "aria-pressed": on ? "true" : "false"
  }, "Admin " + (on ? "on" : "off"));
  btn.addEventListener("click", () => {
    setAdminEnabled(!adminEnabled());
    route();
  });
  document.querySelector(".topbar").append(btn);
}

function paintRail(route) {
  const old = document.getElementById("rail");
  if (old) old.remove();
  if (route.name === "play") {
    const set = getLawProblems(route.law, route.diff) || [];
    if (!window.matchMedia("(max-width: 720px)").matches) {
      document.querySelector(".topbar").append(el("div", { id: "rail", class: "rail" },
        el("p", { class: "rail__title" }, (LEVEL_LABEL[route.diff] || "Diagram") + " · " + route.index + " / " + set.length)));
    }
    return;
  }
  return;

  let title;
  let note;
  let pct;
  let steps;
  if (route.name === "session") {
    const id = route.session;
    pct = sessionPercent(id);
    steps = FLOW[id].map((item) => ({
      label: item[1].replace(/^\d+\s·\s/, ""),
      done: store.task(id, item[2]) >= 1
    }));
    const done = steps.filter((step) => step.done).length;
    title = "Session " + id;
    note = isComplete(id) ? "Complete · saved on this device" : done + " of " + steps.length + " parts · saved on this device";
  } else {
    const names = ["Forces", "Diagram", "Laws", "Net force", "Accel"];
    steps = names.map((label, index) => ({ label: label, done: (store.data.final[index + 1] || 0) >= 1 }));
    const done = steps.filter((step) => step.done).length;
    pct = done * 20;
    title = "Final challenge";
    note = done === 5 ? "Complete · saved on this device" : done + " of 5 challenges · saved on this device";
  }

  const current = steps.findIndex((step) => !step.done);
  const track = el("div", {
    class: "rail__track",
    role: "progressbar",
    "aria-valuemin": "0",
    "aria-valuemax": "100",
    "aria-valuenow": String(pct),
    "aria-label": title + " progress, saved on this device"
  });
  const fill = el("span", { class: "rail__fill" });
  fill.style.width = pct + "%";
  track.append(fill);
  const ticks = el("ol", { class: "rail__ticks" });
  steps.forEach((step, index) => {
    const state = step.done ? "is-done" : (index === current ? "is-now" : "");
    ticks.append(el("li", { class: state }, el("i", { "aria-hidden": "true" }), el("span", {}, step.label)));
  });
  const rail = el("div", { id: "rail", class: "rail" },
    el("div", { class: "rail__top" },
      el("p", { class: "rail__title" }, title),
      el("p", { class: "rail__note" }, note),
      el("strong", { class: "rail__pct" }, pct + "%")
    ),
    track,
    ticks
  );
  document.querySelector(".topbar").append(rail);
}

function sidebarTopicActive(topic) {
  const route = currentRoute();
  if (topic.id === "tutorial") return route.name === "tutorial";
  if (topic.id === "law1") return (route.name === "law" || route.name === "play") && route.law === 1;
  if (topic.id === "law2") return (route.name === "law" || route.name === "play") && route.law === 2;
  if (topic.id === "law3") return (route.name === "law" || route.name === "play") && route.law === 3;
  if (topic.id === "challenge") return route.name === "challenge";
  if (topic.id === "finale") return route.name === "final";
  return false;
}

function paintSidebar(name) {
  const side = document.getElementById("sidebar");
  const topBrand = document.querySelector(".topbar .brand");
  const brand = topBrand ? topBrand.cloneNode(true) : el("a", { class: "brand", href: "#/" },
    el("span", { class: "brand__text" }, el("small", {}, "Physics"), el("strong", {}, "Airea"))
  );

  const done = progressDone();
  const total = progressTotal();
  const pct = Math.round((done / total) * 100);
  const fill = el("i");
  fill.style.width = pct + "%";
  const progress = el("div", { class: "side-progress" },
    el("p", { class: "side-progress__kicker" }, "Course progress"),
    el("p", { class: "side-progress__count" }, el("strong", {}, String(done) + " of " + total), el("span", {}, pct + "%")),
    el("div", {
      class: "side-progress__bar",
      role: "progressbar",
      "aria-valuemin": "0",
      "aria-valuemax": String(total),
      "aria-valuenow": String(done),
      "aria-label": done + " of " + total + " parts complete"
    }, fill)
  );

  const nav = el("nav", { class: "side-nav", "aria-label": "Studio" });
  [["home", "#/", "Home"], ["learn", "#/learn", "Lessons"], ["progress", "#/progress", "Progress"]].forEach(([id, href, label]) => {
    const link = el("a", { href: href, "data-side": id }, label);
    const on = id === name;
    if (on) {
      link.classList.add("is-on");
      link.setAttribute("aria-current", "page");
    }
    nav.append(link);
  });

  const nextId = COURSE_PATH.find((topic) => {
    const status = topicStatus(topic);
    return status !== "Done" && status !== "Locked" && status !== "Open";
  });
  const path = el("ol", { class: "side-path", "aria-labelledby": "side-path-label" });
  COURSE_PATH.forEach((topic, index) => {
    const locked = topicLocked(topic);
    const status = topicStatus(topic);
    const active = sidebarTopicActive(topic);
    const now = active || (!!nextId && topic.id === nextId.id && status !== "Done");
    const cls = ["side-step", "tone-" + topic.tone];
    if (locked) cls.push("is-locked");
    else if (status === "Done") cls.push("is-done");
    if (now) cls.push("is-now");
    const mark = status === "Done" ? "✓" : String(index + 1);
    const node = el(locked ? "button" : "a", {
      href: locked ? null : topic.href,
      type: locked ? "button" : null,
      class: cls.join(" "),
      "aria-current": active ? "page" : null
    },
      el("span", { class: "side-step__mark", "aria-hidden": "true" }, mark),
      el("span", { class: "side-step__body" },
        el("span", { class: "side-step__title" }, topic.title),
        el("span", { class: "side-step__state" }, now && status !== "Done" ? (status === "Continue" ? "Continue" : "Now") : status)
      )
    );
    if (locked) node.addEventListener("click", () => showLockPopup(topicLockMessage(topic), true));
    path.append(el("li", {}, node));
  });

  const footer = [el("p", { class: "side-note" }, "Saved on this device.")];
  const adminPanel = buildAdminPanel("sidebar");
  if (adminPanel) footer.unshift(adminPanel);
  side.replaceChildren(
    el("div", { class: "side-head" },
      brand,
      progress,
      el("p", { class: "side-section" }, "Studio"),
      nav
    ),
    el("div", { class: "side-scroll" },
      el("p", { class: "side-section", id: "side-path-label" }, "Learning path"),
      path
    ),
    el("div", { class: "side-foot" }, ...footer)
  );
  const sc = side.querySelector(".side-scroll");
  const markOverflow = () => {
    const overflow = !!(sc && sc.scrollHeight > sc.clientHeight + 2);
    side.classList.toggle("has-side-overflow", overflow);
  };
  requestAnimationFrame(markOverflow);
}

function buildAdminPanel(place) {
  if (!ADMIN) return null;
  const panel = el("div", { class: "admin-panel" + (place === "sidebar" ? " admin-panel--side" : "") });
  const on = adminEnabled();
  const toggle = el("button", {
    class: "admin-toggle" + (on ? " is-on" : ""),
    type: "button",
    "aria-pressed": on ? "true" : "false"
  }, "Admin mode: ", el("strong", {}, on ? "On" : "Off"));
  toggle.addEventListener("click", () => {
    setAdminEnabled(!adminEnabled());
    route();
  });
  panel.append(toggle);
  if (on) {
    const skip = el("button", { class: "btn btn--ghost admin-skip", type: "button" }, "Unlock all content");
    skip.addEventListener("click", () => {
      adminUnlockAll();
      refreshProgressUI();
      route();
    });
    if (place !== "sidebar") {
      panel.append(el("p", { class: "admin-panel__hint" }, "Skip buttons appear on questions. The learning path stays locked unless you unlock all content."));
    }
    panel.append(skip);
  }
  return panel;
}

function route() {
  if (routing) return;
  const timeup = document.getElementById("timeup-popup");
  if (timeup) timeup.remove();
  abandonPageTimer();
  const info = currentRoute();
  if (info.name === "play") {
    const lawOpen = info.law === 1 ? law1Unlocked() : info.law === 2 ? law2Unlocked() : law3Unlocked();
    if (lawOpen && !lawIntroSeen(info.law)) {
      const to = "#/law/" + info.law;
      if ((location.hash || "#/") !== to) {
        location.replace(to);
        return;
      }
    }
  }
  const blocked = lockMessage(info);
  if (blocked) {
    pendingLock = blocked;
    const fb = "#/learn";
    if ((location.hash || "#/") !== fb) {
      location.replace(fb);
      return;
    }
  }
  routing = true;
  pageController = null;
  setFbdDragging(false);
  paintChrome(info);
  const view = {
    home: viewHome,
    learn: viewLearn,
    sessions: viewSessions,
    tutorial: viewTutorial,
    law: () => viewLaw(info.law),
    play: () => viewPlay(info.law, info.diff, info.index),
    challenge: viewChallenge,
    progress: viewProgress,
    final: viewFinal,
    levelup: () => (info.kind === "tutorial" ? viewTutorialLevelUp() : viewLevelUp(info.law, info.diff)),
    session: () => viewSession(info.session)
  }[info.name] || viewHome;
  main.replaceChildren(view());
  main.focus({ preventScroll: true });
  routing = false;
  if (pendingLock) {
    const message = pendingLock;
    pendingLock = "";
    showLockPopup(message);
  }
}

const SKIP_STEPS = {
  1: ["learn", "explore", "quiz", "challenge"],
  2: ["learn", "explore", "practice", "challenge", "checkpoint"],
  3: ["learn", "explore", "match", "error", "quiz"],
  4: ["learn", "build", "practice"],
  5: ["read", "identify", "construct", "analyze", "apply", "check"]
};
const SKIP_FLAGS = {
  "1.explore": ["s1a", "s1b", "s1c", "s1d"],
  "1.challenge": ["s1ch"],
  "2.explore": ["s2moved", "s2e1", "s2e2"],
  "2.practice": ["s2p1", "s2p2", "s2p3", "s2p4"],
  "2.challenge": ["s2ch"],
  "3.explore": ["s3see0", "s3see1", "s3see2", "s3see3", "s3see4"],
  "3.match": ["s3match"],
  "3.error": ["s3err", "s3why"],
  "5.read": ["s5read-mass", "s5read-push", "s5read-drag"],
  "5.analyze": ["s5net"],
  "5.apply": ["s5eq", "s5a"]
};

function adminSkipButton(label, onClick) {
  if (!adminEnabled()) return null;
  const btn = el("button", { class: "btn btn--ghost admin-skip", type: "button" }, label);
  btn.addEventListener("click", onClick);
  return btn;
}

function skipMark(session, task) {
  (SKIP_FLAGS[session + "." + task] || []).forEach((key) => store.setFlag(key));
  if (task === "quiz" || task === "checkpoint") store.data.best[session + "." + task] = 1;
  store.setTask(session, task, 1);
  store.save();
}

window.skip = function skip() {
  if (!ADMIN) return;
  const session = currentRoute().session;
  if (!session) {
    console.warn("Open a session first, then run skip().");
    return;
  }
  const task = SKIP_STEPS[session].find((name) => store.task(session, name) < 1);
  if (!task) {
    console.log("Session " + session + " is already complete.");
    return;
  }
  skipMark(session, task);
  route();
  console.log("Skipped " + task + " in session " + session + ".");
};

window.finish = function finish(session) {
  if (!ADMIN) return;
  const id = Number(session);
  if (id < 1 || id > 5) {
    console.warn("Use finish(1) through finish(5).");
    return;
  }
  for (let n = 1; n <= id; n++) SKIP_STEPS[n].forEach((task) => skipMark(n, task));
  if (currentRoute().name !== "session" || currentRoute().session !== id) location.hash = "#/session/" + id;
  else route();
  console.log("Session " + id + " is complete.");
};

const FINAL_FLAGS = { 3: ["f3a", "f3b", "f3c"], 4: ["f4"], 5: ["f5"] };

function openFinal() {
  if (currentRoute().name !== "final") location.hash = "#/final";
  else route();
}

window.skipFinal = function skipFinal() {
  if (!ADMIN) return;
  if (!isFinalUnlocked()) {
    console.warn("Finish Session 5 first, or skip each session step with Skip step.");
    return;
  }
  let next = 1;
  while (next <= 5 && (store.data.final[next] || 0) >= 1) next += 1;
  if (next > 5) {
    console.log("Final challenge is already complete.");
    openFinal();
    return;
  }
  (FINAL_FLAGS[next] || []).forEach((key) => store.setFlag(key));
  store.data.final[next] = 1;
  store.save();
  openFinal();
  console.log("Skipped final challenge " + next + " of 5.");
};

window.finishFinal = function finishFinal() {
  if (!ADMIN) return;
  if (!isFinalUnlocked()) for (let n = 1; n <= 5; n++) SKIP_STEPS[n].forEach((task) => skipMark(n, task));
  for (let n = 1; n <= 5; n++) {
    (FINAL_FLAGS[n] || []).forEach((key) => store.setFlag(key));
    store.data.final[n] = 1;
  }
  store.save();
  openFinal();
  console.log("Final challenge is complete.");
};

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
document.body.classList.toggle("is-admin", adminEnabled());
window.addEventListener("hashchange", route);
if (!location.hash) location.hash = "#/";
route();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => { /* Offline support is optional on unsupported hosts. */ });
  });
}
