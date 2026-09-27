// Hand-written etymologies and tradition readings that ship with the app so the
// most common searches work fully offline, without any AI or network call.
// Merged over the base tables in js/data/knowledge.mjs by js/data/index.mjs.

export const ETYM_EXTRA = {
  'jesus christ': {
    parts: [
      { p: 'jesus', ch: [{ l: 'Latin', w: 'Iesus', m: 'from greek' }, { l: 'Greek', w: 'Iēsous', m: 'rendering of the aramaic name' }, { l: 'Hebrew', w: 'Yehoshua / Yeshua', m: 'yah saves, yah is salvation' }] },
      { p: 'christ', ch: [{ l: 'Greek', w: 'Christos', m: 'anointed one' }, { l: 'Greek', w: 'chriein', m: 'to rub, to anoint with oil' }, { l: 'Hebrew', w: 'mashiach', m: 'messiah, the anointed' }] },
    ],
    syn: 'the one whom god saves through, marked by the oil of office',
    root: 'a name that is itself a sentence: salvation is of yah — carried by a title that means the oil has been poured',
  },
  'holy spirit': {
    parts: [
      { p: 'holy', ch: [{ l: 'Old English', w: 'hālig', m: 'whole, uninjured, sacred' }, { l: 'Proto-Germanic', w: '*hailagaz', m: 'from *hailaz — whole, healthy' }, { l: 'PIE', w: '*kailo-', m: 'whole, uninjured, of good omen' }] },
      { p: 'spirit', ch: [{ l: 'Latin', w: 'spiritus', m: 'breath, breathing, the soul' }, { l: 'Latin', w: 'spirare', m: 'to breathe' }, { l: 'Hebrew', w: 'ruach ha-kodesh', m: 'the breath of the set-apart' }] },
    ],
    syn: 'the whole breath — that which breathes wholeness',
    root: 'holy and whole and health are one germanic word; spirit is breath in latin, greek (pneuma) and hebrew (ruach) alike',
  },
  'in the beginning': {
    parts: [
      { p: 'beginning', ch: [{ l: 'Old English', w: 'beginnan', m: 'to attempt, undertake, open' }, { l: 'Proto-Germanic', w: '*biginnan', m: 'be- + *ginnan, to open, cut open' }, { l: 'Hebrew', w: 'bereshit', m: 'in-the-head-of, at the head (gen 1:1)' }, { l: 'Greek', w: 'en archē', m: 'in the origin / in the rule (john 1:1)' }] },
    ],
    syn: 'at the head, where the cut is first opened',
    root: 'the hebrew bereshit begins with bet, the second letter — creation starts in duality, not unity',
  },
  uriel: {
    parts: [
      { p: 'uri', ch: [{ l: 'Hebrew', w: 'ur / or', m: 'light, flame, fire' }, { l: 'Semitic', w: '*ʾwr', m: 'to be light, to shine' }] },
      { p: 'el', ch: [{ l: 'Hebrew', w: 'el', m: 'god, the mighty one' }, { l: 'Semitic', w: '*ʾil-', m: 'god, deity' }] },
    ],
    syn: 'light of god / god is my light',
    root: 'one of the four archangels of the cardinal directions in enochic tradition; the flame that illuminates rather than consumes',
  },
  gematria: {
    parts: [
      { p: 'gematria', ch: [{ l: 'Hebrew', w: 'gimatriya', m: 'numerical letter interpretation' }, { l: 'Greek', w: 'geōmetria', m: 'earth-measure — geometry' }, { l: 'Greek', w: 'grammateia (alt.)', m: 'letter-craft, the art of letters' }] },
    ],
    syn: 'measuring the earth of a word by its letters',
    root: 'the rabbinic borrowing of a greek word for measurement — number and letter as one substance',
  },
  love: {
    parts: [
      { p: 'love', ch: [{ l: 'Old English', w: 'lufu', m: 'affection, friendliness, desire' }, { l: 'Proto-Germanic', w: '*lubō', m: 'love' }, { l: 'PIE', w: '*leubh-', m: 'to care, desire, love' }] },
    ],
    syn: 'the desire that cares',
    root: 'the same root gives leave (permission) and belief — love, belief and permission share one pie stem',
  },
  light: {
    parts: [
      { p: 'light', ch: [{ l: 'Old English', w: 'lēoht', m: 'brightness, radiant energy' }, { l: 'Proto-Germanic', w: '*leuhtam', m: 'light' }, { l: 'PIE', w: '*leuk-', m: 'light, brightness' }] },
    ],
    syn: 'that which shines',
    root: 'lucifer, lucid, illuminate, lunar and lux descend from the same *leuk-; the hebrew or (אור) is 207, the greek phōs from *bha- (to shine, to speak)',
  },
  truth: {
    parts: [
      { p: 'truth', ch: [{ l: 'Old English', w: 'trēowth', m: 'faithfulness, fidelity, pledge' }, { l: 'Proto-Germanic', w: '*treuwithō', m: 'from *treuwaz — firm, steadfast' }, { l: 'PIE', w: '*deru-', m: 'be firm, solid — also tree' }] },
    ],
    syn: 'steadfast as a tree',
    root: 'truth and tree are the same word — the true is the firm; hebrew emet (אמת) spans aleph to tav, first letter to last',
  },
  wisdom: {
    parts: [
      { p: 'wis', ch: [{ l: 'Old English', w: 'wīs', m: 'learned, sagacious' }, { l: 'PIE', w: '*weid-', m: 'to see, to know' }] },
      { p: 'dom', ch: [{ l: 'Old English', w: '-dōm', m: 'condition, jurisdiction, judgment' }] },
    ],
    syn: 'the condition of having seen',
    root: 'wisdom, vision, video and veda share *weid- — knowledge is a completed act of seeing',
  },
  angel: {
    parts: [
      { p: 'angel', ch: [{ l: 'Latin', w: 'angelus', m: 'messenger' }, { l: 'Greek', w: 'angelos', m: 'messenger, envoy' }, { l: 'Hebrew', w: 'malakh', m: 'messenger, one sent' }] },
    ],
    syn: 'one who is sent with a message',
    root: 'the word names a function, not a species — an angel is any carrier of a word from elsewhere',
  },
  spirit: {
    parts: [
      { p: 'spirit', ch: [{ l: 'Latin', w: 'spiritus', m: 'breath, breathing' }, { l: 'Latin', w: 'spirare', m: 'to breathe' }, { l: 'PIE', w: '*(s)peis-', m: 'to blow' }] },
    ],
    syn: 'the breath',
    root: 'inspire, expire, conspire, respire: the whole family is breathing — spirit is the air that moves',
  },
  word: {
    parts: [
      { p: 'word', ch: [{ l: 'Old English', w: 'word', m: 'speech, talk, utterance' }, { l: 'Proto-Germanic', w: '*wurdą', m: 'word' }, { l: 'PIE', w: '*werh₁-', m: 'to speak, say' }, { l: 'Latin', w: 'verbum', m: 'word (cognate)' }] },
    ],
    syn: 'that which is spoken',
    root: 'hebrew davar means both word and thing — a spoken word is an event, not a label',
  },
  name: {
    parts: [
      { p: 'name', ch: [{ l: 'Old English', w: 'nama', m: 'name, reputation' }, { l: 'PIE', w: '*h₁nómn̥', m: 'name' }, { l: 'Hebrew', w: 'shem', m: 'name, essence, memorial' }] },
    ],
    syn: 'the sound by which a thing is called into presence',
    root: 'one of the oldest words in every indo-european language — hebrew shem also means reputation and the divine name itself (ha-shem)',
  },
  god: {
    parts: [
      { p: 'god', ch: [{ l: 'Old English', w: 'god', m: 'supreme being, deity' }, { l: 'Proto-Germanic', w: '*gudan', m: 'that which is invoked' }, { l: 'PIE', w: '*ǵʰu-tó-', m: 'the poured, the invoked — from *ǵʰeu- to pour, to call' }] },
    ],
    syn: 'the one invoked by libation',
    root: 'not related to good — the root is pouring and calling; god is what is called upon over the poured offering',
  },
  soul: {
    parts: [
      { p: 'soul', ch: [{ l: 'Old English', w: 'sāwol', m: 'spiritual and emotional part of a person' }, { l: 'Proto-Germanic', w: '*saiwalō', m: 'possibly from *saiwaz — sea, lake' }, { l: 'Hebrew', w: 'nefesh', m: 'throat, breath, living being' }] },
    ],
    syn: 'that which comes from and returns to the sea',
    root: 'a disputed germanic word; if from *saiwaz, souls were thought to dwell in lakes before birth and after death',
  },
  heaven: {
    parts: [
      { p: 'heaven', ch: [{ l: 'Old English', w: 'heofon', m: 'sky, home of god' }, { l: 'Proto-Germanic', w: '*hibin-', m: 'sky, possibly the covering' }, { l: 'Hebrew', w: 'shamayim', m: 'the heavens — dual form: there-waters' }] },
    ],
    syn: 'the covering above',
    root: 'hebrew shamayim is grammatically dual — two heavens, or waters (mayim) with the prefix sham (there)',
  },
  earth: {
    parts: [
      { p: 'earth', ch: [{ l: 'Old English', w: 'eorþe', m: 'ground, soil, dry land' }, { l: 'Proto-Germanic', w: '*erþō', m: 'earth' }, { l: 'PIE', w: '*h₁er-', m: 'earth, ground' }, { l: 'Hebrew', w: 'eretz', m: 'land, earth' }] },
    ],
    syn: 'the ground beneath',
    root: 'hebrew adam is from adamah (ground) — man is named for the earth he is made from',
  },
  money: {
    parts: [
      { p: 'money', ch: [{ l: 'Old French', w: 'monoie', m: 'coinage, currency' }, { l: 'Latin', w: 'moneta', m: 'mint, coinage' }, { l: 'Latin', w: 'Juno Moneta', m: 'juno the warner — coins were struck in her temple' }, { l: 'Latin', w: 'monere', m: 'to warn, to remind' }] },
    ],
    syn: 'that which warns, struck in the temple of the warner',
    root: 'money, monitor, admonish and monster share monere — a coin is a warning made metal',
  },
  time: {
    parts: [
      { p: 'time', ch: [{ l: 'Old English', w: 'tīma', m: 'limited space of time' }, { l: 'Proto-Germanic', w: '*tīmô', m: 'from *dī- to divide' }, { l: 'PIE', w: '*deh₂-', m: 'to divide, to cut' }] },
    ],
    syn: 'that which is divided',
    root: 'time and tide are the same word — a division of flow; greek chronos cuts, kairos opens',
  },
  death: {
    parts: [
      { p: 'death', ch: [{ l: 'Old English', w: 'dēaþ', m: 'cessation of life' }, { l: 'Proto-Germanic', w: '*dauþuz', m: 'from *dau- to die' }, { l: 'PIE', w: '*dheu-', m: 'to pass away, become senseless' }] },
    ],
    syn: 'the passing away',
    root: 'hebrew mavet (מות) = 446; the tarot arcanum 13 reads it as transformation, not end',
  },
  life: {
    parts: [
      { p: 'life', ch: [{ l: 'Old English', w: 'līf', m: 'existence, lifetime, way of living' }, { l: 'Proto-Germanic', w: '*lībą', m: 'body, life — from *leip- to remain, continue' }, { l: 'PIE', w: '*leip-', m: 'to stick, adhere, remain' }] },
    ],
    syn: 'that which remains',
    root: 'life is what sticks — hebrew chai (חי) = 18, which is why 18 is the number of blessing',
  },
};

export const TRAD_EXTRA = {
  government: {
    hebrew: 'the hebrew <em>memshalah</em> (dominion) and <em>malchut</em> (kingdom) — the tenth sefirah, where all higher emanations become concrete. rule is the last and lowest station of the light.',
    biblical: '"the government shall be upon his shoulder" (isaiah 9:6). romans 13 calls rulers servants of god; revelation 13 shows the same power as a beast. the text holds both.',
    greek: 'plato\'s <em>kubernetes</em> — the helmsman — is the root of both government and cybernetics. the republic argues only the philosopher who has seen the good may steer.',
    occult: 'govern-ment: to steer the mind. the hermetic reading is literal — the apparatus of state is a mind-steering machine, and the mason\'s square and compass are instruments of governance over matter.',
  },
  logos: {
    hebrew: 'the targums render god\'s creative speech as the <em>memra</em> — the word that acts. genesis 1 creates by ten utterances; the sefer yetzirah maps them to the ten sefirot.',
    biblical: '"in the beginning was the word, and the word was with god, and the word was god" (john 1:1). the logos becomes flesh (john 1:14): reason itself takes a body.',
    greek: 'heraclitus: all things happen according to the logos. for the stoics it is the rational fire ordering the cosmos; for philo of alexandria it is the mediating pattern between god and world.',
    occult: 'the logos is the magician\'s word of power — creation by utterance. in thelema every man and woman is a star; in hermeticism the word is the sun that speaks matter into form.',
  },
  'jesus christ': {
    hebrew: 'yeshua (ישוע) = 386; yehoshua (יהושע) = 391. the name contains the tetragrammaton\'s yod-heh-vav with shin — some kabbalists read the pentagrammaton (יהשוה) as the name made flesh.',
    biblical: 'the name means "yah saves" (matthew 1:21 — "he shall save his people"). christ (christos) translates messiah — anointed as prophets, priests and kings were anointed with oil.',
    greek: 'ΙΗΣΟΥΣ = 888 by isopsephy — eight, the number beyond seven (completion), tripled. early christians noted 888 stands opposite 666, the beast, in the same numerical language.',
    occult: 'the rosicrucian and hermetic readings treat christ as the solar logos — the sun at the heart of the tree (tiphareth, 6). the crucifixion at the centre of the tree is the sacrifice that holds the pillars in balance.',
  },
  'holy spirit': {
    hebrew: '<em>ruach ha-kodesh</em> — the breath of holiness. it hovers over the waters (genesis 1:2) and inspires the prophets; in kabbalah the shekhinah is its indwelling, feminine presence.',
    biblical: 'the third person of the trinity — descending as a dove (matthew 3:16), as wind and fire at pentecost (acts 2). the paraclete, the one called alongside (john 14:26).',
    greek: '<em>pneuma hagion</em> — pneuma is breath, wind, spirit at once. stoic pneuma is the tensioned breath that holds all bodies together; the church took the word and kept the physics.',
    occult: 'the hermetic <em>spiritus mundi</em> — the universal breath the alchemist condenses. the third principle beside sulphur and salt is mercury: the mediating, volatile, spirit-substance.',
  },
  'in the beginning': {
    hebrew: '<em>bereshit</em> (בראשית) = 913. the first word of torah begins with bet, the second letter, not aleph — the midrash asks why, and answers: bet is blessing (berakhah), and bet is a house, closed on three sides and open toward the text.',
    biblical: 'genesis 1:1 and john 1:1 open with the same phrase. john deliberately rewrites the first verse of scripture to place the logos where the hebrew placed god\'s speech.',
    greek: '<em>en archē</em> — archē is both beginning and rule, origin and principle. anaximander sought the archē of all things; john answers that the archē is a person.',
    occult: 'the first word contains the whole. kabbalists permute bereshit into <em>bara shit</em> (created six) and <em>brit esh</em> (covenant of fire). the beginning is the seed-form of the end.',
  },
  uriel: {
    hebrew: 'אוריאל = 248 — the number of positive commandments and, tradition says, of the limbs of the body. one of the four archangels around the throne: michael, gabriel, raphael, uriel.',
    biblical: 'uriel does not appear in the protestant canon; he stands at the gate of eden in 2 esdras and guides enoch through the heavens in 1 enoch. the book of enoch names him over the world and tartarus.',
    greek: 'no direct classical counterpart — but the function matches prometheus inverted: a bearer of light who gives illumination as the law permits, not against it.',
    occult: 'in the golden dawn uriel is the archangel of earth and the north, invoked in the lesser banishing ritual. he holds the flaming sword and the sheaf of grain: light that becomes bread.',
  },
  gematria: {
    hebrew: 'one of the thirty-two rules of rabbi eliezer for interpreting torah. the classic case: eliezer\'s 318 servants (genesis 14:14) = the name eliezer (אליעזר) — abraham took one man.',
    biblical: 'revelation 13:18 is the one explicit gematria in the new testament: "let him that hath understanding count the number of the beast" — 666, widely read as nero caesar in hebrew letters.',
    greek: 'isopsephy: greek letters doubled as numerals, so every word was already a sum. graffiti at pompeii reads "i love her whose number is 545". the practice predates the hebrew usage.',
    occult: 'the golden dawn and crowley built entire systems on hebrew gematria (777 and other qabalistic writings). the method: two words of equal value share a hidden identity.',
  },
  love: {
    hebrew: '<em>ahavah</em> (אהבה) = 13 = <em>echad</em> (אחד), one. love and unity are the same number; together they make 26, the tetragrammaton. "hear o israel, the lord is one … and you shall love."',
    biblical: '"god is love" (1 john 4:8). the greatest commandment is love of god and neighbour (matthew 22:37-39). paul\'s hymn (1 corinthians 13) makes it the one thing that remains.',
    greek: 'four words: <em>eros</em> (desire), <em>philia</em> (friendship), <em>storge</em> (family affection), <em>agape</em> (self-giving love). plato\'s symposium makes eros the ladder from bodies to the beautiful itself.',
    occult: '"love is the law, love under will" (liber al). in the tree, love is chesed (mercy, 4) balanced by geburah; the alchemical coniunctio is love as the union of opposites.',
  },
  light: {
    hebrew: '<em>or</em> (אור) = 207 = <em>ein sof</em> (אין סוף), the infinite. "let there be light" comes before the sun is made (genesis 1:3 vs 1:16) — the kabbalists read this as a hidden primordial light stored for the righteous.',
    biblical: '"i am the light of the world" (john 8:12). "god is light, and in him is no darkness at all" (1 john 1:5). the new jerusalem needs no sun (revelation 21:23).',
    greek: '<em>phōs</em> — plato\'s sun in the republic stands for the good: as the sun makes seeing possible, the good makes knowing possible. the cave prisoners turn toward the light.',
    occult: 'lux, lucifer, illumination: the light-bearer and the illuminated. the hermetic <em>nous</em> is light; the rosicrucian goal is the <em>lux</em> that dawns after nigredo, the blackening.',
  },
  truth: {
    hebrew: '<em>emet</em> (אמת) = 441 = 21 squared. its letters are the first, middle and last of the alphabet — truth spans everything. remove the aleph and it becomes <em>met</em>, dead: the golem legend.',
    biblical: '"what is truth?" (john 18:38) — pilate\'s question to the one who said "i am the way, the truth and the life." "the truth shall make you free" (john 8:32).',
    greek: '<em>aletheia</em> — un-forgetting, un-concealment. heidegger read it as the unveiling of what is; for plato truth is the correspondence of the soul\'s sight with the forms.',
    occult: 'the egyptian <em>maat</em> — truth as the feather against which the heart is weighed. the hermetic axiom: "true, without falsehood, certain and most true" opens the emerald tablet.',
  },
};

// Additional scripture / number references merged over SCRIPTURE.
export const SCRIPTURE_EXTRA = {
  1: 'one god (deut 6:4) · one body (eph 4:4) · aleph, the silent beginning',
  2: 'two witnesses (rev 11) · two tablets · male and female (gen 1:27)',
  4: 'four rivers of eden · four living creatures (ezek 1) · four gospels · four horsemen (rev 6)',
  5: 'five loaves (matt 14:17) · five books of torah · david\'s five stones (1 sam 17:40)',
  8: 'eight saved in the ark (1 pet 3:20) · circumcision on the eighth day · resurrection on the eighth day',
  9: 'nine fruits of the spirit (gal 5:22) · ninth hour (matt 27:46)',
  10: 'ten commandments · ten plagues · ten virgins (matt 25) · ten utterances of creation',
  13: 'thirteen at the last supper · echad (one) and ahavah (love) both = 13',
  17: '153 = triangular of 17 · ark rested on the 17th day (gen 8:4) · seventeen is victory in rabbinic reading',
  18: 'chai (life) = 18 · woman bound eighteen years (luke 13:16)',
  21: 'daniel fasted twenty-one days (dan 10:2-3) · 7 × 3',
  22: 'twenty-two letters of hebrew · twenty-two chapters of revelation · psalm 119 has 22 stanzas',
  24: 'twenty-four elders (rev 4:4) · twenty-four courses of priests (1 chr 24)',
  26: 'yhwh = 26 · twenty-six generations from adam to moses',
  28: 'twenty-eight times in ecclesiastes 3 · a perfect number · the lunar month',
  30: 'jesus began ministry at thirty (luke 3:23) · thirty pieces of silver (matt 26:15)',
  33: 'years of christ · thirty-three vertebrae · master number',
  36: 'lamed-vav: thirty-six hidden righteous ones who sustain the world',
  42: 'forty-two generations (matt 1:17) · forty-two months (rev 13:5) · forty-two stations in the wilderness',
  49: 'seven sevens · pentecost counted from passover · the year before jubilee',
  50: 'jubilee (lev 25) · pentecost (acts 2) · fifty days',
  70: 'seventy nations (gen 10) · seventy elders (num 11) · seventy years in babylon · seventy weeks (dan 9)',
  72: 'seventy-two names of god (exod 14:19-21) · seventy-two disciples (luke 10:1) · seventy-two translators of the septuagint',
  99: 'abraham circumcised at ninety-nine (gen 17:1) · ninety-nine sheep (luke 15:4) · ninety-nine names of god in islam',
  100: 'hundredfold (matt 13:8) · abraham at one hundred (gen 21:5)',
  120: 'moses\' age (deut 34:7) · one hundred twenty in the upper room (acts 1:15) · years of grace before the flood (gen 6:3)',
  300: 'gideon\'s three hundred (judg 7) · ark three hundred cubits long (gen 6:15)',
  318: 'abraham\'s three hundred eighteen trained men (gen 14:14) = eliezer in hebrew gematria',
  365: 'enoch lived 365 years (gen 5:23) · abraxas = 365 · days of the year',
  390: 'ezekiel lay 390 days for israel (ezek 4:5)',
  400: 'four hundred years in egypt (gen 15:13) · tav, the last letter = 400',
  430: 'four hundred thirty years of sojourning (exod 12:40)',
  490: 'seventy times seven (matt 18:22) · seventy weeks of years (dan 9:24)',
  500: 'five hundred brethren saw the risen christ (1 cor 15:6)',
  600: 'noah was six hundred at the flood (gen 7:6) · six hundred chariots (exod 14:7)',
  613: 'six hundred thirteen commandments of torah · 248 positive + 365 negative',
  616: 'variant number of the beast in papyrus 115 · nero caesar in latin spelling',
  700: 'solomon\'s seven hundred wives (1 kgs 11:3)',
  969: 'methuselah\'s years (gen 5:27) — the longest life',
  1000: 'a thousand years as one day (ps 90:4, 2 pet 3:8) · the millennium (rev 20)',
  1260: 'one thousand two hundred sixty days (rev 11:3, 12:6) · time, times and half a time',
  1290: 'daniel 12:11 · from the abomination',
  1335: 'daniel 12:12 · blessed is he who waits',
  1600: 'one thousand six hundred furlongs of blood (rev 14:20)',
  2300: 'two thousand three hundred evenings and mornings (dan 8:14)',
  12000: 'twelve thousand from each tribe (rev 7) · twelve thousand furlongs, the city (rev 21:16)',
  144000: 'the sealed of israel (rev 7:4, 14:1) · 12 × 12 × 1000',
};
