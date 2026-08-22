/**
 * Brutal tier (difficulty 4).
 *
 * These are meant to be genuinely hard — specialist-level, or the kind of
 * thing you only know if you have read around the subject. Every distractor
 * is a real entity from the same field, so guessing is close to a coin toss
 * between four plausible options.
 *
 * [question, correct, wrong, wrong, wrong, difficulty]
 */
export default [
  // --- mathematics & logic ---
  ['Which mathematician proved the Poincaré conjecture and declined the Fields Medal?', 'Grigori Perelman', 'Andrew Wiles', 'Shing-Tung Yau', 'Michael Freedman', 4],
  ['What is the smallest Carmichael number?', '561', '341', '1105', '1729', 4],
  ['In category theory, what is a functor?', 'A structure-preserving map between categories', 'An object with no morphisms', 'A set of natural transformations', 'A commutative diagram', 4],
  ['What does the Löwenheim–Skolem theorem imply about first-order theories?', 'A theory with an infinite model has models of every infinite cardinality', 'Every theory has a finite model', 'All models are isomorphic', 'Consistency implies completeness', 4],
  ['Which number is known as the Hardy–Ramanujan number?', '1729', '1728', '2027', '496', 4],
  ['What is the Euler characteristic of a torus?', '0', '2', '1', '−2', 4],
  ['Which problem asks whether P equals NP?', 'A Millennium Prize Problem in complexity theory', 'A problem in number theory', 'A conjecture about prime gaps', 'A question in set theory', 4],
  ['What is a "perfect number"?', 'A number equal to the sum of its proper divisors', 'A number with exactly two divisors', 'A number that is a square and a cube', 'A number whose digits sum to itself', 4],
  ['Which sequence is defined by a(n) = a(n−1) + a(n−2) with a different seed than Fibonacci?', 'The Lucas numbers', 'The Catalan numbers', 'The Bell numbers', 'The Motzkin numbers', 4],
  ['What does the Riemann zeta function evaluate to at s = 2?', 'π²/6', 'π/4', 'e', 'ln 2', 4],
  ['In graph theory, what does a Hamiltonian path visit exactly once?', 'Every vertex', 'Every edge', 'Every face', 'Every cycle', 4],
  ['Which cipher was broken by exploiting its lack of a letter mapping to itself?', 'The Enigma machine', 'The Vigenère cipher', 'The Playfair cipher', 'The Caesar cipher', 4],

  // --- physics ---
  ['What is the approximate value of the fine-structure constant?', '1/137', '1/42', '1/299', '1/1836', 4],
  ['Which experiment first measured the charge of the electron directly?', 'Millikan’s oil drop experiment', 'The Stern–Gerlach experiment', 'The Franck–Hertz experiment', 'Thomson’s cathode ray experiment', 4],
  ['What does the Aharonov–Bohm effect demonstrate?', 'Electromagnetic potentials have physical significance even where fields vanish', 'Light behaves as a particle', 'Spin is quantised', 'Vacuum energy is nonzero', 4],
  ['Which theorem forbids a quantum state from being copied exactly?', 'The no-cloning theorem', 'Bell’s theorem', 'The Kochen–Specker theorem', 'The adiabatic theorem', 4],
  ['What does Bell’s theorem rule out?', 'Local hidden-variable theories', 'Quantum superposition', 'Wavefunction collapse', 'Entanglement', 4],
  ['What is the Lamb shift?', 'A small energy difference between hydrogen orbitals predicted degenerate by Dirac', 'The redshift of distant galaxies', 'A nuclear spin transition', 'A phase change in superfluids', 4],
  ['Which phase of matter did Bose and Einstein predict?', 'Bose–Einstein condensate', 'Quark–gluon plasma', 'Superfluid helium-3', 'Fermi liquid', 4],
  ['What is the Hubble constant a measure of?', 'The current expansion rate of the universe', 'The mass of the observable universe', 'The age of the Sun', 'The curvature of spacetime', 4],
  ['Which particle has never been directly detected but is required by general relativity’s quantisation attempts?', 'The graviton', 'The neutrino', 'The tau lepton', 'The gluon', 4],
  ['What does the Meissner effect describe?', 'Expulsion of magnetic fields from a superconductor', 'Thermal expansion of metals', 'Electron tunnelling', 'Magnetic hysteresis', 4],
  ['What is the approximate energy scale of the Planck mass in GeV?', 'About 10¹⁹ GeV', 'About 10³ GeV', 'About 10¹² GeV', 'About 10²⁷ GeV', 4],
  ['Which nuclear process powers the Sun’s core primarily?', 'The proton–proton chain', 'The CNO cycle', 'The triple-alpha process', 'Neutron capture', 4],

  // --- chemistry & biology ---
  ['What does the Hill coefficient describe in biochemistry?', 'The cooperativity of ligand binding', 'Enzyme turnover rate', 'Membrane permeability', 'Protein folding speed', 4],
  ['Which amino acid is not encoded by the standard genetic code but incorporated via a stop codon?', 'Selenocysteine', 'Ornithine', 'Citrulline', 'Homocysteine', 4],
  ['What is the Michaelis constant (Km) a measure of?', 'Substrate concentration at half maximal reaction velocity', 'Maximum reaction velocity', 'Enzyme concentration', 'Activation energy', 4],
  ['Which type of RNA polymerase transcribes messenger RNA in eukaryotes?', 'RNA polymerase II', 'RNA polymerase I', 'RNA polymerase III', 'Primase', 4],
  ['What is the Woodward–Hoffmann set of rules concerned with?', 'The stereochemistry of pericyclic reactions', 'Acid–base equilibria', 'Crystal field splitting', 'Polymer chain length', 4],
  ['Which effect explains the deep colour of transition metal complexes?', 'd–d electronic transitions', 'Nuclear magnetic resonance', 'Beta decay', 'Van der Waals forces', 4],
  ['What does an "endosymbiotic" origin explain for chloroplasts?', 'They descend from engulfed cyanobacteria', 'They form from Golgi vesicles', 'They are viral in origin', 'They arise from nuclear budding', 4],
  ['Which biological clock protein family won the 2017 Nobel Prize in Medicine?', 'The period and timeless circadian proteins', 'The p53 tumour suppressors', 'The telomerase complex', 'The hedgehog signalling family', 4],
  ['What is "apoptosis" distinguished from "necrosis" by?', 'It is programmed and does not cause inflammation', 'It only affects nerve cells', 'It is caused by viruses', 'It happens only in embryos', 4],
  ['Which molecule serves as the universal electron carrier named for nicotinamide?', 'NAD+', 'FAD', 'Coenzyme A', 'Ubiquinone', 4],
  ['What does the "central dogma" of molecular biology state?', 'Information flows from DNA to RNA to protein', 'Proteins can rewrite DNA', 'RNA is always single-stranded', 'Genes are always expressed', 4],
  ['Which mineral class do feldspars belong to?', 'Silicates', 'Carbonates', 'Sulphates', 'Oxides', 4],

  // --- history & politics ---
  ['Which battle in 1683 marked the failure of the Ottoman siege of Vienna?', 'The Battle of Kahlenberg', 'The Battle of Mohács', 'The Battle of Lepanto', 'The Battle of Zenta', 4],
  ['The Treaty of Karlowitz in 1699 marked the decline of which empire in Europe?', 'The Ottoman Empire', 'The Habsburg Empire', 'The Polish–Lithuanian Commonwealth', 'The Swedish Empire', 4],
  ['Who was the first Abbasid caliph?', 'Al-Saffah', 'Harun al-Rashid', 'Al-Mansur', 'Al-Ma’mun', 4],
  ['Which empire did the Battle of Ain Jalut in 1260 halt?', 'The Mongol Empire', 'The Byzantine Empire', 'The Fatimid Caliphate', 'The Crusader States', 4],
  ['What was the "Great Schism" of 1054 between?', 'The Roman Catholic and Eastern Orthodox churches', 'Sunni and Shia Islam', 'Catholics and Protestants', 'Rival papal claimants', 4],
  ['Which Chinese dynasty preceded the Tang?', 'Sui', 'Han', 'Jin', 'Sung', 4],
  ['Who was the Aztec ruler at the time of Cortés’s arrival?', 'Moctezuma II', 'Cuauhtémoc', 'Ahuitzotl', 'Itzcoatl', 4],
  ['The Peace of Augsburg in 1555 established which principle?', 'Cuius regio, eius religio', 'Habeas corpus', 'Papal infallibility', 'Freedom of the seas', 4],
  ['Which kingdom did the Kingdom of Aksum occupy?', 'Modern Ethiopia and Eritrea', 'Modern Sudan and Egypt', 'Modern Yemen and Oman', 'Modern Mali and Niger', 4],
  ['What was the "Long March" and who undertook it?', 'A retreat by Chinese communist forces in 1934–35', 'A Soviet advance in 1943', 'An Indian protest march in 1930', 'A Roman military campaign', 4],
  ['Which country was ruled by the Tokugawa shogunate?', 'Japan', 'Korea', 'China', 'Vietnam', 4],
  ['The Reconquista concluded with the fall of which city in 1492?', 'Granada', 'Seville', 'Córdoba', 'Toledo', 4],
  ['Which agreement ended the Russo-Japanese War?', 'The Treaty of Portsmouth', 'The Treaty of Shimonoseki', 'The Treaty of Nerchinsk', 'The Treaty of Aigun', 4],
  ['Who was the principal architect of German unification in 1871?', 'Otto von Bismarck', 'Wilhelm I', 'Helmuth von Moltke', 'Friedrich Ebert', 4],

  // --- arts, music & letters ---
  ['Which composer wrote the "Rite of Spring", which caused a riot at its 1913 premiere?', 'Igor Stravinsky', 'Claude Debussy', 'Maurice Ravel', 'Sergei Prokofiev', 4],
  ['Who wrote the novel "Gravity’s Rainbow"?', 'Thomas Pynchon', 'Don DeLillo', 'William Gaddis', 'John Barth', 4],
  ['Which poet wrote "The Love Song of J. Alfred Prufrock"?', 'T. S. Eliot', 'Ezra Pound', 'Wallace Stevens', 'Hart Crane', 4],
  ['Which painter is credited with the first purely abstract work?', 'Wassily Kandinsky', 'Kazimir Malevich', 'Piet Mondrian', 'Robert Delaunay', 4],
  ['Who wrote "The Book of Disquiet"?', 'Fernando Pessoa', 'José Saramago', 'Eça de Queirós', 'António Lobo Antunes', 4],
  ['Which Baroque composer wrote "The Art of Fugue"?', 'Johann Sebastian Bach', 'George Frideric Handel', 'Georg Philipp Telemann', 'Domenico Scarlatti', 4],
  ['Who directed "Andrei Rublev" and "Stalker"?', 'Andrei Tarkovsky', 'Sergei Eisenstein', 'Nikita Mikhalkov', 'Aleksandr Sokurov', 4],
  ['Which novel by Laurence Sterne famously digresses and includes a black page?', 'Tristram Shandy', 'Tom Jones', 'Clarissa', 'Pamela', 4],
  ['Which art movement did Filippo Marinetti found with a 1909 manifesto?', 'Futurism', 'Vorticism', 'Constructivism', 'Suprematism', 4],
  ['Who wrote "The Man Without Qualities"?', 'Robert Musil', 'Hermann Broch', 'Joseph Roth', 'Stefan Zweig', 4],
  ['Which sculptor created "Bird in Space"?', 'Constantin Brâncuși', 'Alberto Giacometti', 'Henry Moore', 'Jean Arp', 4],
  ['Who composed "Symphonie fantastique"?', 'Hector Berlioz', 'Franz Liszt', 'Robert Schumann', 'Felix Mendelssohn', 4],

  // --- language, geography & the obscure ---
  ['Which language has the most native speakers in Nigeria?', 'Hausa', 'Yoruba', 'Igbo', 'Fulani', 4],
  ['What is the only sea without any coastline?', 'The Sargasso Sea', 'The Coral Sea', 'The Weddell Sea', 'The Andaman Sea', 4],
  ['Which country contains the geographic point furthest from any ocean?', 'China', 'Kazakhstan', 'Mongolia', 'Russia', 4],
  ['What is an "exclave"?', 'Territory of a state geographically separated from the main part', 'A disputed border zone', 'A colony granted self-rule', 'An uninhabited island', 4],
  ['Which strait connects the Mediterranean to the Sea of Marmara?', 'The Dardanelles', 'The Bosphorus', 'The Strait of Messina', 'The Strait of Otranto', 4],
  ['Which language is an official language of both India and Fiji?', 'Hindi', 'Tamil', 'Bengali', 'Urdu', 4],
  ['What is the linguistic term for a word borrowed and then re-borrowed back in altered form?', 'A reborrowing', 'A calque', 'A doublet', 'A cognate', 4],
  ['Which writing system is a "syllabary" rather than an alphabet?', 'Japanese kana', 'Greek', 'Cyrillic', 'Arabic', 4],
  ['What is a "calque"?', 'A loan translation, word by word', 'A false friend', 'An untranslatable idiom', 'A phonetic borrowing', 4],
  ['Which peninsula is Anatolia also known as?', 'Asia Minor', 'The Levant', 'The Maghreb', 'Mesopotamia', 4],
  ['What does the Coriolis effect determine about large-scale wind direction?', 'It deflects motion right in the north and left in the south', 'It causes the trade winds to reverse yearly', 'It creates the jet stream from nothing', 'It equalises hemispheric pressure', 4],
  ['Which lake contains roughly a fifth of the world’s unfrozen fresh surface water?', 'Lake Baikal', 'Lake Superior', 'Lake Tanganyika', 'Lake Victoria', 4],
  ['Which country’s legal system is based on the Napoleonic Code as its ancestor?', 'France', 'England', 'Sweden', 'Russia', 4],
  ['What is a "kenning" in Old Norse and Old English poetry?', 'A compound metaphorical phrase', 'A repeated refrain', 'An alliterative line break', 'A rhyming couplet', 4],
];
