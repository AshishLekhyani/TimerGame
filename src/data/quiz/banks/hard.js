/**
 * Hard tier (difficulty 3).
 *
 * The bar here: a well-read adult should have to actually think, and should
 * get a meaningful fraction of these wrong. Distractors are deliberately
 * plausible — the wrong answers are real things from the same domain.
 *
 * [question, correct, wrong, wrong, wrong, difficulty]
 */
export default [
  // --- mathematics ---
  ['Who proved Fermat’s Last Theorem in 1994?', 'Andrew Wiles', 'Grigori Perelman', 'Terence Tao', 'Paul Erdős', 3],
  ['What does Gödel’s first incompleteness theorem establish?', 'Any consistent formal system strong enough for arithmetic contains true but unprovable statements', 'All mathematical statements are decidable in principle', 'Arithmetic is inconsistent', 'Every axiom system can be made complete by adding axioms', 3],
  ['The Banach–Tarski paradox depends on which controversial axiom?', 'The axiom of choice', 'The axiom of infinity', 'The continuum hypothesis', 'The axiom of foundation', 3],
  ['What is the cardinality of the set of real numbers called?', 'The cardinality of the continuum', 'Aleph-null', 'Countable infinity', 'Omega', 3],
  ['Which conjecture concerns the distribution of the zeros of the zeta function?', 'The Riemann hypothesis', 'The Goldbach conjecture', 'The twin prime conjecture', 'The Collatz conjecture', 3],
  ['What is a "group" in abstract algebra required to have?', 'Closure, associativity, identity and inverses', 'Commutativity and distributivity', 'A metric and a topology', 'A basis and a dimension', 3],
  ['Which mathematician introduced the notation "e" for the base of natural logarithms?', 'Leonhard Euler', 'John Napier', 'Jacob Bernoulli', 'Gottfried Leibniz', 3],
  ['What does the Poincaré conjecture concern?', 'The characterisation of the 3-sphere', 'The distribution of primes', 'The solvability of quintics', 'The four-colour problem', 3],
  ['In topology, what does it mean for two shapes to be homeomorphic?', 'One can be continuously deformed into the other without cutting or gluing', 'They have the same area', 'They have the same number of vertices', 'They are mirror images', 3],
  ['Which number system did Hamilton invent in 1843, extending complex numbers?', 'Quaternions', 'Octonions', 'Surreal numbers', 'p-adic numbers', 3],
  ['What is the Collatz conjecture about?', 'A sequence rule that appears always to reach 1', 'The gaps between consecutive primes', 'Perfect numbers', 'The sum of reciprocals of squares', 3],
  ['Which theorem states that a continuous function on a closed interval attains its bounds?', 'The extreme value theorem', 'The intermediate value theorem', 'Rolle’s theorem', 'The mean value theorem', 3],
  ['What did Évariste Galois’s theory establish about polynomial equations?', 'Why the general quintic has no solution in radicals', 'That every polynomial has a real root', 'That pi is transcendental', 'That primes are infinite', 3],

  // --- physics & astronomy ---
  ['What is the Chandrasekhar limit approximately?', '1.4 solar masses', '3.2 solar masses', '0.6 solar masses', '8 solar masses', 3],
  ['What does the Pauli exclusion principle forbid?', 'Two identical fermions occupying the same quantum state', 'Energy being created or destroyed', 'Faster-than-light travel', 'Photons interfering with each other', 3],
  ['Which experiment disproved the existence of the luminiferous aether?', 'The Michelson–Morley experiment', 'The Stern–Gerlach experiment', 'The Millikan oil drop experiment', 'The Cavendish experiment', 3],
  ['What does the Casimir effect demonstrate?', 'Vacuum energy producing a measurable force between plates', 'Gravity bending light', 'Superconductivity above 100K', 'Nuclear fusion at room temperature', 3],
  ['Which particle was predicted by Dirac before it was observed?', 'The positron', 'The neutron', 'The muon', 'The pion', 3],
  ['What is the Schwarzschild radius of an object?', 'The radius at which it would become a black hole', 'The radius of its outer atmosphere', 'The distance light travels in one second', 'Its radius of gyration', 3],
  ['Which quantity is conserved as a consequence of time-translation symmetry, by Noether’s theorem?', 'Energy', 'Momentum', 'Angular momentum', 'Electric charge', 3],
  ['What is the approximate temperature of the cosmic microwave background?', '2.7 kelvin', '13.8 kelvin', '0.3 kelvin', '300 kelvin', 3],
  ['Which effect describes light losing energy climbing out of a gravitational well?', 'Gravitational redshift', 'Compton scattering', 'The photoelectric effect', 'Cherenkov radiation', 3],
  ['What causes Cherenkov radiation’s characteristic blue glow?', 'Particles travelling faster than light in a medium', 'Nuclear fission fragments', 'Electron–positron annihilation', 'Neutron capture', 3],
  ['In quantum mechanics, what does the wavefunction’s squared magnitude give?', 'A probability density', 'The particle’s energy', 'The particle’s momentum', 'The particle’s spin', 3],
  ['Which law relates a black body’s peak emission wavelength to its temperature?', 'Wien’s displacement law', 'Stefan–Boltzmann law', 'Planck’s law', 'Rayleigh–Jeans law', 3],
  ['What are the three "generations" of matter in the Standard Model composed of?', 'Pairs of quarks plus a lepton and its neutrino', 'Protons, neutrons and electrons', 'Bosons, fermions and hadrons', 'Baryons, mesons and leptons', 3],
  ['Which unit is defined by the caesium-133 hyperfine transition?', 'The second', 'The metre', 'The kelvin', 'The ampere', 3],

  // --- chemistry & biology ---
  ['Which enzyme unwinds the DNA double helix at the replication fork?', 'Helicase', 'Ligase', 'Polymerase', 'Topoisomerase', 3],
  ['What does the Krebs cycle primarily produce for the electron transport chain?', 'NADH and FADH2', 'ATP directly', 'Glucose', 'Pyruvate', 3],
  ['Which scientist’s X-ray diffraction image was crucial to solving DNA’s structure?', 'Rosalind Franklin', 'Barbara McClintock', 'Dorothy Hodgkin', 'Martha Chase', 3],
  ['What is the function of the enzyme telomerase?', 'It extends chromosome ends', 'It splices introns', 'It transports mRNA', 'It degrades misfolded proteins', 3],
  ['Which principle explains why enantiomers can have wildly different biological effects?', 'Chirality of biological receptors', 'Isotope effects', 'Resonance stabilisation', 'Le Chatelier’s principle', 3],
  ['What does Le Chatelier’s principle predict?', 'A system at equilibrium shifts to counteract an imposed change', 'Reaction rates double every 10°C', 'Entropy always increases', 'Gases expand when heated', 3],
  ['Which molecule is the primary electron acceptor in photosystem II?', 'Pheophytin', 'NADP+', 'Plastocyanin', 'Ferredoxin', 3],
  ['What is a prion?', 'A misfolded protein that induces misfolding in others', 'A virus without a capsid', 'A bacterial plasmid', 'A fragment of RNA', 3],
  ['Which process allows bacteria to exchange genes without reproducing?', 'Horizontal gene transfer', 'Binary fission', 'Sporulation', 'Meiosis', 3],
  ['What does CRISPR-Cas9 use to locate a target DNA sequence?', 'A guide RNA', 'A restriction enzyme', 'An antibody', 'A methyl group', 3],
  ['Which organelle is thought to derive from an engulfed bacterium?', 'The mitochondrion', 'The nucleus', 'The lysosome', 'The Golgi apparatus', 3],
  ['What is the name for the pH at which an amino acid carries no net charge?', 'Isoelectric point', 'Equivalence point', 'Buffer point', 'Titration midpoint', 3],
  ['Which class of drug inhibits the enzyme HMG-CoA reductase?', 'Statins', 'Beta blockers', 'ACE inhibitors', 'Diuretics', 3],
  ['What does the Hardy–Weinberg principle describe?', 'Allele frequencies in a non-evolving population', 'The rate of speciation', 'Mutation load', 'Genetic drift in small populations', 3],

  // --- history ---
  ['Which Byzantine emperor commissioned the codification of Roman law?', 'Justinian I', 'Constantine I', 'Heraclius', 'Basil II', 3],
  ['The Battle of Manzikert in 1071 was a disaster for which empire?', 'The Byzantine Empire', 'The Abbasid Caliphate', 'The Holy Roman Empire', 'The Bulgarian Empire', 3],
  ['Which treaty divided the New World between Spain and Portugal?', 'Treaty of Tordesillas', 'Treaty of Zaragoza', 'Treaty of Alcáçovas', 'Treaty of Madrid', 3],
  ['The Defenestration of Prague in 1618 helped trigger which conflict?', 'The Thirty Years’ War', 'The Hussite Wars', 'The War of the Spanish Succession', 'The Great Northern War', 3],
  ['Which dynasty ruled Persia at the time of the Arab conquest?', 'Sassanid', 'Achaemenid', 'Parthian', 'Safavid', 3],
  ['What was the Edict of Nantes concerned with?', 'Rights for French Protestants', 'The expulsion of Jews from Spain', 'The partition of Poland', 'Papal authority in England', 3],
  ['Which empire did the Battle of Talas in 751 involve alongside the Abbasids?', 'Tang China', 'The Gupta Empire', 'The Khmer Empire', 'The Tibetan Empire', 3],
  ['The Meiji Restoration transformed which country?', 'Japan', 'Korea', 'China', 'Thailand', 3],
  ['Which African empire was famed for the pilgrimage of Mansa Musa?', 'The Mali Empire', 'The Songhai Empire', 'The Kingdom of Kush', 'The Ashanti Empire', 3],
  ['What was the Congress of Vienna convened to do?', 'Redraw Europe after Napoleon’s defeat', 'End the Thirty Years’ War', 'Partition the Ottoman Empire', 'Found the League of Nations', 3],
  ['Which civilisation produced the Antikythera mechanism?', 'Ancient Greece', 'Ancient Rome', 'Ancient Egypt', 'Babylon', 3],
  ['The Taiping Rebellion took place in which country?', 'China', 'Japan', 'Vietnam', 'Korea', 3],
  ['Which pope called the First Crusade?', 'Urban II', 'Gregory VII', 'Innocent III', 'Clement V', 3],
  ['What did the Bretton Woods conference establish in 1944?', 'The IMF and the World Bank', 'The United Nations', 'NATO', 'The European Coal and Steel Community', 3],
  ['The Sykes–Picot Agreement secretly divided which region?', 'The Ottoman Middle East', 'Sub-Saharan Africa', 'Southeast Asia', 'The Balkans', 3],
  ['Which ruler is associated with the "Salt March" opposition in 1930?', 'The British Raj administration', 'The Mughal court', 'The Portuguese Estado da Índia', 'The Dutch East India Company', 3],
  ['What was the Zimmermann Telegram?', 'A German proposal of alliance to Mexico', 'A British ultimatum to Germany', 'A Russian surrender offer', 'An American declaration of war', 3],
  ['Which battle is considered the turning point of the Eastern Front in WWII?', 'Stalingrad', 'Kursk', 'Moscow', 'Leningrad', 3],
  ['The Investiture Controversy was a dispute between popes and which power?', 'The Holy Roman Emperors', 'The Kings of France', 'The Byzantine Emperors', 'The Doges of Venice', 3],

  // --- philosophy & ideas ---
  ['In philosophy of mind, what does "qualia" refer to?', 'The subjective character of experience', 'Logical inference rules', 'Innate categories of understanding', 'Statements about existence', 3],
  ['Which philosopher wrote "Critique of Pure Reason"?', 'Immanuel Kant', 'G. W. F. Hegel', 'Arthur Schopenhauer', 'Johann Fichte', 3],
  ['What is Occam’s razor a principle of?', 'Preferring the explanation with fewest assumptions', 'Rejecting all metaphysics', 'Doubting the senses', 'Deriving ethics from reason alone', 3],
  ['Which thought experiment challenges functionalism about understanding?', 'Searle’s Chinese Room', 'Schrödinger’s cat', 'The trolley problem', 'Plato’s cave', 3],
  ['What did Karl Popper propose as the demarcation of science?', 'Falsifiability', 'Verifiability', 'Reproducibility alone', 'Consensus', 3],
  ['Which philosopher argued for the "veil of ignorance" in theories of justice?', 'John Rawls', 'Robert Nozick', 'Jeremy Bentham', 'Isaiah Berlin', 3],
  ['What is the "is–ought problem" associated with?', 'David Hume', 'John Locke', 'Thomas Hobbes', 'Adam Smith', 3],
  ['Which school of thought did Zeno of Citium found?', 'Stoicism', 'Epicureanism', 'Cynicism', 'Scepticism', 3],
  ['What does "epistemology" study?', 'The nature and limits of knowledge', 'The nature of being', 'Moral obligation', 'Beauty and taste', 3],
  ['Which philosopher wrote "Being and Time"?', 'Martin Heidegger', 'Jean-Paul Sartre', 'Edmund Husserl', 'Maurice Merleau-Ponty', 3],
  ['What is the "categorical imperative" associated with?', 'Kant’s moral philosophy', 'Utilitarian calculus', 'Aristotelian virtue ethics', 'Divine command theory', 3],

  // --- literature & art deep cuts ---
  ['Who wrote "In Search of Lost Time"?', 'Marcel Proust', 'André Gide', 'Gustave Flaubert', 'Stendhal', 3],
  ['Which novel is written largely as a single day in Dublin, 16 June 1904?', 'Ulysses', 'Dubliners', 'The Dead', 'At Swim-Two-Birds', 3],
  ['Who wrote "The Master and Margarita"?', 'Mikhail Bulgakov', 'Vladimir Nabokov', 'Andrei Platonov', 'Isaac Babel', 3],
  ['Which poet wrote the "Duino Elegies"?', 'Rainer Maria Rilke', 'Paul Celan', 'Georg Trakl', 'Stefan George', 3],
  ['Who wrote "If on a winter’s night a traveler"?', 'Italo Calvino', 'Umberto Eco', 'Primo Levi', 'Cesare Pavese', 3],
  ['Which movement did the "Salon des Refusés" of 1863 help launch?', 'Impressionism', 'Cubism', 'Romanticism', 'Symbolism', 3],
  ['Who painted "The Garden of Earthly Delights"?', 'Hieronymus Bosch', 'Pieter Bruegel the Elder', 'Jan van Eyck', 'Matthias Grünewald', 3],
  ['Which composer wrote the opera cycle "Der Ring des Nibelungen"?', 'Richard Wagner', 'Richard Strauss', 'Carl Maria von Weber', 'Engelbert Humperdinck', 3],
  ['Who composed "Gurre-Lieder"?', 'Arnold Schoenberg', 'Alban Berg', 'Anton Webern', 'Gustav Mahler', 3],
  ['Which technique did Schoenberg pioneer?', 'Twelve-tone serialism', 'Minimalism', 'Musique concrète', 'Aleatoric music', 3],
  ['Who wrote "The Leopard", a novel of Sicilian aristocratic decline?', 'Giuseppe Tomasi di Lampedusa', 'Alberto Moravia', 'Elsa Morante', 'Leonardo Sciascia', 3],
  ['Which architect coined "less is more"?', 'Ludwig Mies van der Rohe', 'Le Corbusier', 'Walter Gropius', 'Louis Sullivan', 3],
  ['Who wrote "Invisible Man" (1952)?', 'Ralph Ellison', 'James Baldwin', 'Richard Wright', 'Langston Hughes', 3],
  ['Which artist is associated with the Merz collages?', 'Kurt Schwitters', 'Hannah Höch', 'Max Ernst', 'Marcel Duchamp', 3],
  ['Who wrote "The Tin Drum"?', 'Günter Grass', 'Heinrich Böll', 'Uwe Johnson', 'Siegfried Lenz', 3],

  // --- language & linguistics ---
  ['What does an "ergative" language mark distinctively?', 'The subject of a transitive verb', 'The object of a preposition', 'Grammatical gender', 'Verb tense', 3],
  ['Which language family includes Finnish, Hungarian and Estonian?', 'Uralic', 'Indo-European', 'Altaic', 'Caucasian', 3],
  ['What is the Sapir–Whorf hypothesis about?', 'Language shaping thought', 'The origin of writing', 'Universal grammar', 'Sound change over time', 3],
  ['What does Grimm’s law describe?', 'A systematic consonant shift in Germanic languages', 'Vowel harmony in Turkic', 'Word order universals', 'The origins of the alphabet', 3],
  ['Which script remains substantially undeciphered?', 'Linear A', 'Linear B', 'Cuneiform', 'Egyptian hieroglyphs', 3],
  ['What is a "phoneme" distinguished from an "allophone" by?', 'It distinguishes meaning', 'It is louder', 'It is written differently', 'It occurs word-initially', 3],
  ['Which language is the most widely spoken Dravidian language?', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 3],
  ['What does "agglutinative" describe in morphology?', 'Words built from strings of distinct affixes', 'Words that never inflect', 'Words formed by internal vowel change', 'Words with tonal distinctions', 3],
  ['What is "code-switching" in linguistics?', 'Alternating between languages within a conversation', 'Encrypting speech', 'Changing register formally', 'Translating idioms literally', 3],

  // --- economics & law ---
  ['What does the Gini coefficient measure?', 'Income or wealth inequality', 'Inflation', 'Unemployment', 'Trade balance', 3],
  ['What is "moral hazard" in economics?', 'Taking more risk because someone else bears the cost', 'Lying about product quality', 'Colluding to fix prices', 'Underreporting income', 3],
  ['Which economist described "creative destruction"?', 'Joseph Schumpeter', 'John Maynard Keynes', 'Friedrich Hayek', 'Milton Friedman', 3],
  ['What is a "Giffen good"?', 'A good whose demand rises as its price rises', 'A good with perfectly elastic demand', 'A good with no substitutes', 'A luxury good', 3],
  ['What does "habeas corpus" require?', 'That a detainee be brought before a court', 'That evidence be disclosed', 'That trials be public', 'That juries be unanimous', 3],
  ['What is the "tragedy of the commons"?', 'Shared resources being depleted by individual self-interest', 'Public goods being overfunded', 'Monopolies raising prices', 'Currency devaluation spirals', 3],
  ['Which theorem shows no voting system can satisfy all fairness criteria?', 'Arrow’s impossibility theorem', 'Coase theorem', 'Nash equilibrium', 'Pareto principle', 3],
  ['What is a Nash equilibrium?', 'A state where no player gains by changing strategy alone', 'The outcome maximising total welfare', 'A guaranteed win for one player', 'An unstable strategy pairing', 3],
  ['What does "stagflation" combine?', 'Stagnant growth and high inflation', 'Deflation and recession', 'Full employment and inflation', 'Growth and deflation', 3],
];
