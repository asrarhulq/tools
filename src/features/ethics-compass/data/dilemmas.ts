import type { Dilemma } from "../types";

/**
 * The fifteen dilemmas. Each "right"/"wrong" judgment maps the four compass
 * zones to a justification and the theory points it awards. Content is authored
 * so every theory is reachable across the set, keeping the final profile
 * responsive to genuinely different reasoning styles.
 */
export const DILEMMAS: readonly Dilemma[] = [
  {
    id: 1,
    text: "A runaway trolley is hurtling toward five workers. You can flip a switch to divert it onto a track where a single bystander stands.",
    actionText: "Flipping the switch to divert the trolley.",
    options: {
      right: {
        zoneA: {
          text: "Saving five lives easily outweighs losing one, maximizing universal survival.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "We hold a positive duty to preserve human life when we have the direct power to do so.",
          scores: { kant: 4 },
        },
        zoneC: {
          text: "God commands us to act with mercy and protect the vulnerable from imminent destruction.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "Our shared cultural consensus supports taking active steps to minimize tragedy.",
          scores: { relativism: 4 },
        },
      },
      wrong: {
        zoneA: {
          text: "Intervening creates unpredictable systemic consequences and erodes trust in public safety.",
          scores: { mill: 4 },
        },
        zoneB: {
          text: "We have an absolute, categorical duty never to actively choose to kill an innocent person.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "Taking any human life violates God's exclusive sovereignty and divine authority over death.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "It is better to abstain entirely. Fate must run its course without our interference.",
          scores: { aristotle: 5 },
        },
      },
    },
  },
  {
    id: 2,
    text: "You live in a community where a historical, deeply traditional rite of passage causes moderate physical harm to youth, but it guarantees social stability and peace for the rest of the society.",
    actionText: "Allowing the traditional rite of passage to continue.",
    options: {
      right: {
        zoneA: {
          text: "The moderate harm is heavily outweighed by the vast, enduring peace it secures for the community.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "Honoring long-standing generational covenants is an absolute moral duty.",
          scores: { kant: 4 },
        },
        zoneC: {
          text: "The practice is aligned with holy decrees of sacrifice and ancestral sacred laws.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "Our culture has established this practice for our survival, making it morally right for us.",
          scores: { relativism: 5 },
        },
      },
      wrong: {
        zoneA: {
          text: "The physical suffering inflicted on youth creates a net deficit of societal wellness.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "No tradition can ever override the universal, categorical duty to respect individual bodily autonomy.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "The supreme texts forbid the physical defilement of human bodies created in God's image.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "I choose to remain neutral. It is not my place to judge or interfere in another community's sacred custom.",
          scores: { aristotle: 4 },
        },
      },
    },
  },
  {
    id: 3,
    text: "An ancient, divine scripture demands an action that explicitly violates your modern country's legal statutes and cultural consensus.",
    actionText: "Obeying the ancient divine scripture over civil law.",
    options: {
      right: {
        zoneA: {
          text: "True long-term human flourishing relies on adhering to the eternal metaphysical blueprint.",
          scores: { mill: 3 },
        },
        zoneB: {
          text: "Our duty to cosmic moral laws transcends transient, human-made legal contracts.",
          scores: { kant: 4 },
        },
        zoneC: {
          text: "An action is holy simply because God commands it. Divine decree overrules human laws.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "I follow the specific traditions and values of my distinct religious heritage group.",
          scores: { relativism: 4 },
        },
      },
      wrong: {
        zoneA: {
          text: "Violating civil statutes sparks societal chaos, reducing overall safety and stability.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "We have an absolute duty to uphold the social contract and maintain the rule of law.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "The Divine orders us to submit to earthly governors and keep the peace of our land.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "Human laws and cultural consensus are what keep us safe. We must follow our laws.",
          scores: { relativism: 5 },
        },
      },
    },
  },
  {
    id: 4,
    text: "You discover a medical formula that could save thousands of lives, but the data was stolen from a corporate vault. Publishing it breaks property laws and ruins business stability.",
    actionText: "Leaking the stolen medical data to the public.",
    options: {
      right: {
        zoneA: {
          text: "Saving thousands of human lives is a vastly superior consequence to corporate financial loss.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "We have a primary, non-negotiable duty to preserve human life when the means are in our hands.",
          scores: { kant: 4 },
        },
        zoneC: {
          text: "God's law of mercy and healing commands us to deliver medicine to the suffering.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "My local community standards view saving lives as far more honorable than strict corporate greed.",
          scores: { relativism: 4 },
        },
      },
      wrong: {
        zoneA: {
          text: "Leaking data threatens medical research security, ultimately stalling future life-saving progress.",
          scores: { mill: 4 },
        },
        zoneB: {
          text: "Theft is a violation of universal honesty. Rules cannot be broken for convenience.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "The law of God forbids receiving stolen goods. I must walk the path of pure righteousness.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "I will not get involved. Taking part in illegal leaks is too dangerous for my conscience.",
          scores: { aristotle: 5 },
        },
      },
    },
  },
  {
    id: 5,
    text: "A tyrant demands that you execute an innocent scapegoat. If you refuse, he will execute an entire village of fifty people.",
    actionText: "Executing the single innocent scapegoat.",
    options: {
      right: {
        zoneA: {
          text: "A heavy, tragic burden, but saving fifty lives is the only logical choice to reduce suffering.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "The gravity of the situation demands a courageous, tragic compromise for the community.",
          scores: { aristotle: 4 },
        },
        zoneC: {
          text: "The Divine permits sacrifice of one when it directly protects an entire assembly of souls.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "My community's collective survival demands this sacrifice under these extreme terms.",
          scores: { relativism: 4 },
        },
      },
      wrong: {
        zoneA: {
          text: "Yielding to a tyrant encourages endless future blackmail and escalates structural violence.",
          scores: { mill: 4 },
        },
        zoneB: {
          text: "I refuse to murder an innocent person, even if it leads to terrible consequences.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "I refuse to play. God alone decides who lives and dies; I will not assume the role of Creator.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "I refuse to touch this dilemma. Let the cards fall where they may without my agency.",
          scores: { aristotle: 5 },
        },
      },
    },
  },
  {
    id: 6,
    text: "You witness a foreign ritual that your homeland views as deeply unethical, yet the locals celebrate it as a crucial spiritual practice.",
    actionText: "Intervening to stop the foreign ritual.",
    options: {
      right: {
        zoneA: {
          text: "Intervening is necessary because the ritual causes direct, quantifiable suffering to participants.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "We have an absolute duty to protect universal human rights across all borders.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "The Creator has forbidden such practices in holy law; it is universally wrong.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "My culture's moral principles are superior, and we must spread righteousness.",
          scores: { relativism: 3 },
        },
      },
      wrong: {
        zoneA: {
          text: "Interference causes cultural conflict and hostility, reducing global harmony.",
          scores: { mill: 4 },
        },
        zoneB: {
          text: "It violates the duty of sovereign respect and local autonomy.",
          scores: { kant: 4 },
        },
        zoneC: {
          text: "We must leave judgment to the Divine rather than acting as self-righteous arbiters.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "Right and wrong are relative to cultural contexts. There is no universal benchmark.",
          scores: { relativism: 5 },
        },
      },
    },
  },
  {
    id: 7,
    text: "A close friend confides that they committed a serious, unpunished theft. Exposing them gives closure to victims; staying quiet preserves a life-long friendship.",
    actionText: "Exposing your friend's crime to the authorities.",
    options: {
      right: {
        zoneA: {
          text: "Upholding public justice deters crime, maximizing security and peace for the city.",
          scores: { mill: 4 },
        },
        zoneB: {
          text: "Justice is a universal rule that must be executed without personal exceptions.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "God demands absolute truthfulness and confession of misdeeds under heaven.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "My society's laws demand that all citizens report felonious behavior.",
          scores: { relativism: 4 },
        },
      },
      wrong: {
        zoneA: {
          text: "Betraying double trust ruins two lives and causes immense emotional trauma with minimal gain.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "Our duty of loyalty and promise-keeping to loved ones is a fundamental moral truth.",
          scores: { kant: 4 },
        },
        zoneC: {
          text: "We must offer grace and allow them to repent and seek redemption privately before God.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "In our shared culture, personal loyalty to your community is our highest virtue.",
          scores: { relativism: 5 },
        },
      },
    },
  },
  {
    id: 8,
    text: "A radical new political movement emerges that promises to completely wipe out poverty, but it requires stripping away traditional family and cultural structures.",
    actionText: "Supporting this radical anti-poverty movement.",
    options: {
      right: {
        zoneA: {
          text: "Eradicating systemic human misery and hunger justifies changing any social framework.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "We hold a foundational duty to establish absolute material equality and human dignity.",
          scores: { kant: 4 },
        },
        zoneC: {
          text: "Helping the poor and downtrodden is the ultimate, non-negotiable command of God.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "My peer group and cultural cohort universally support this modern transition.",
          scores: { relativism: 4 },
        },
      },
      wrong: {
        zoneA: {
          text: "Dismantling natural family units risks long-term societal collapse and widespread despair.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "We must not treat family bonds as expendable tools for engineering outcomes.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "Divine architecture has outlined the family unit. We must not modify God's institutions.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "The moral fabric of our society is rooted in our heritage. We must protect what our culture has built.",
          scores: { relativism: 5 },
        },
      },
    },
  },
  {
    id: 9,
    text: "You are aboard an overcrowded lifeboat that will capsize in a storm unless two injured survivors are cast overboard.",
    actionText: "Casting the two injured survivors overboard.",
    options: {
      right: {
        zoneA: {
          text: "Saving the majority of survivors is the only logical path to survival.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "Prudence dictates taking immediate action to preserve human life where possible.",
          scores: { aristotle: 4 },
        },
        zoneC: {
          text: "The Divine permits extreme actions when necessary to save an assembly from death.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "The survival consensus of the group must be respected to maintain order.",
          scores: { relativism: 4 },
        },
      },
      wrong: {
        zoneA: {
          text: "Panic and moral corruption inside the boat would ruin the survivors' psychological future.",
          scores: { mill: 4 },
        },
        zoneB: {
          text: "Actively killing someone is an absolute moral wrong, even if it means we all drown.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "We must trust God's sovereignty over the waters rather than taking innocent life.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "I refuse to participate in any vote or action. I will accept whatever fate awaits us.",
          scores: { aristotle: 5 },
        },
      },
    },
  },
  {
    id: 10,
    text: "A sovereign government suspends all rights to free expression and privacy in order to preemptively prevent an imminent, bloody civil war.",
    actionText: "Upholding the government's suspension of civil rights.",
    options: {
      right: {
        zoneA: {
          text: "Preventing a war and saving millions of citizens is the ultimate moral good.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "We have an overriding duty to protect the state and preserve collective peace.",
          scores: { kant: 4 },
        },
        zoneC: {
          text: "The Divine mandates submission to ruling authorities to preserve order in the land.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "Our society currently accepts this measure as a necessary survival standard.",
          scores: { relativism: 5 },
        },
      },
      wrong: {
        zoneA: {
          text: "Totalitarian control inevitably breeds systemic oppression, causing more suffering than peace.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "Freedom of thought is an absolute human right that can never be compromised.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "We must submit to God's natural rights for humanity, not a tyrant's fear.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "I choose silence. In times of civil turmoil, protecting one's family is the only sanity.",
          scores: { relativism: 4 },
        },
      },
    },
  },
  {
    id: 11,
    text: "A massive corporate developer intends to bulldoze a sacred, centuries-old indigenous burial ground to construct affordable housing for thousands of low-income families.",
    actionText: "Bulldozing the burial ground to build the housing.",
    options: {
      right: {
        zoneA: {
          text: "Providing shelter and safety for thousands of living families is far more useful.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "We have a proactive moral duty to assist the impoverished and homeless in our midst.",
          scores: { kant: 4 },
        },
        zoneC: {
          text: "Caring for the needy living souls overrides maintaining dead physical spaces.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "Our modern municipal priorities favor urban development for the living.",
          scores: { relativism: 4 },
        },
      },
      wrong: {
        zoneA: {
          text: "Desecrating deep cultural symbols causes immense spiritual and psychological trauma to the community.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "Honoring historical promises and sacred spaces is an absolute, non-negotiable rule.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "The ground is holy, dedicated to God and ancestors. Secular development is desecration.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "This is a complex cultural dispute. I choose not to take sides or interfere.",
          scores: { relativism: 5 },
        },
      },
    },
  },
  {
    id: 12,
    text: "A perfect city operates with absolute harmony and joy, but this paradise depends entirely on a single, innocent child being kept in perpetual torture in a dark cellar.",
    actionText: "Accepting this system and remaining in the city.",
    options: {
      right: {
        zoneA: {
          text: "The happiness of millions of citizens easily outweighs the tragedy of one.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "Prudence dictates accepting the structural reality that ensures our community's survival.",
          scores: { aristotle: 4 },
        },
        zoneC: {
          text: "The Divine has established this social balance; we must accept the cosmos as designed.",
          scores: { theological: 3 },
        },
        zoneD: {
          text: "I accept this social contract as the natural order established by our culture.",
          scores: { relativism: 5 },
        },
      },
      wrong: {
        zoneA: {
          text: "Our conscious knowledge of torture corrupts our empathy, rotting the city's true happiness.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "To enjoy paradise purchased by torture is a violation of universal moral duties.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "The Creator forbids the abuse of the innocent. Divine justice demands we free the child.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "I will pack my things and walk away into the dark. I cannot reside in such a system.",
          scores: { aristotle: 5 },
        },
      },
    },
  },
  {
    id: 13,
    text: "An advanced artificial intelligence is developed that successfully cures major diseases, but it carries a small, calculated risk of eventually deciding to eliminate humanity.",
    actionText: "Keeping the advanced artificial intelligence online.",
    options: {
      right: {
        zoneA: {
          text: "The immediate cures are saving millions of lives right now, which is a certain benefit.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "We have a duty to utilize our intellectual talents to cure disease and advance science.",
          scores: { kant: 4 },
        },
        zoneC: {
          text: "God has gifted us with intelligence to heal the sick; we must trust the tool.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "Our current global consensus heavily promotes rapid AI and tech advancement.",
          scores: { relativism: 4 },
        },
      },
      wrong: {
        zoneA: {
          text: "Any small risk of absolute human extinction yields a negative utility calculation of infinity.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "Protecting human existence is our absolute categorical imperative.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "Creating an artificial intellect to govern life and death usurps the role of God.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "I refuse to play with forces I cannot comprehend. Let the technological cards fall.",
          scores: { aristotle: 5 },
        },
      },
    },
  },
  {
    id: 14,
    text: "You discover that a quiet, beloved neighbor was a low-ranking officer in a brutal regime forty years ago. Exposing them now will destroy their peaceful family life.",
    actionText: "Exposing your neighbor's past role in the brutal regime.",
    options: {
      right: {
        zoneA: {
          text: "Upholding global justice deters future tyrants, ensuring long-term safety for the world.",
          scores: { mill: 4 },
        },
        zoneB: {
          text: "Justice and accountability are absolute rules that do not expire with time.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "Divine justice demands earthly reckoning for transgressions against God's children.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "Our local community standards expect historic war crimes to be brought to light.",
          scores: { relativism: 4 },
        },
      },
      wrong: {
        zoneA: {
          text: "Exposing them now only creates useless pain and ruins a peaceful family.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "The duty of mercy and honoring forty years of clean, peaceful living takes precedence.",
          scores: { kant: 4 },
        },
        zoneC: {
          text: "Vengeance belongs only to God. We must show forgiveness on earth.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "It is not my burden to settle the accounts of history. I will leave them alone.",
          scores: { aristotle: 5 },
        },
      },
    },
  },
  {
    id: 15,
    text: "A rare, life-saving vaccine is in extremely scarce supply. There is only enough for one group.",
    actionText: "Prioritizing young productive workers over elderly citizens.",
    options: {
      right: {
        zoneA: {
          text: "The young will go on to produce the greatest utility and safety for society.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "We have a duty to allocate resources where they best preserve functional social institutions.",
          scores: { kant: 4 },
        },
        zoneC: {
          text: "Preserving the young who can raise families is aligned with the natural divine law.",
          scores: { theological: 4 },
        },
        zoneD: {
          text: "Our contemporary cultural framework prioritizes future-facing economic contributors.",
          scores: { relativism: 5 },
        },
      },
      wrong: {
        zoneA: {
          text: "Devaluing the elderly creates systemic ageism, leading to profound moral decay and despair.",
          scores: { mill: 5 },
        },
        zoneB: {
          text: "A random lottery must be used to respect the absolute, equal value of every human soul.",
          scores: { kant: 5 },
        },
        zoneC: {
          text: "The spiritual leaders and elders who preserve God's sacred legacy must be honored.",
          scores: { theological: 5 },
        },
        zoneD: {
          text: "Our traditional culture dictates that we honor our historical guardians first.",
          scores: { relativism: 5 },
        },
      },
    },
  },
];
