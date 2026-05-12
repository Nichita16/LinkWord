const fs = require('fs');

// New concepts organized by group
// Each concept: [word, [connections], group]
// Connections reference both existing (508) and new words
const NEW_CONCEPTS = {

// ═══════════════════════════════════════════
//  NATURE (expand from 39 → ~100)
// ═══════════════════════════════════════════
nature: [
  ["acorn",["oak","seed","squirrel","tree","fall","forest","grow"]],
  ["bamboo",["forest","green","grow","panda","wind","wood"]],
  ["bark",["dog","tree","forest","oak","wood","wolf"]],
  ["bay",["beach","harbor","ocean","sail","ship","water"]],
  ["birch",["bark","forest","leaf","tree","white","wood"]],
  ["blossom",["bloom","cherry","flower","pink","spring","tree"]],
  ["bog",["earth","frog","marsh","mud","swamp","water"]],
  ["branch",["bird","leaf","nest","oak","tree","wind","wood"]],
  ["brook",["fish","flow","river","rock","stream","water"]],
  ["bud",["bloom","flower","green","grow","leaf","spring"]],
  ["bush",["berry","bird","garden","green","leaf","thorn"]],
  ["canyon",["cliff","desert","echo","mountain","river","rock"]],
  ["cedar",["forest","green","mountain","tree","wood"]],
  ["cliff",["canyon","eagle","fall","mountain","ocean","rock"]],
  ["clover",["field","green","luck","meadow","spring"]],
  ["coast",["beach","island","ocean","rock","salt","sand","wave"]],
  ["cove",["bay","beach","island","ocean","rock","water"]],
  ["creek",["brook","fish","flow","river","rock","water"]],
  ["delta",["river","sand","sea","water","earth"]],
  ["dew",["dawn","drop","flower","grass","leaf","morning","water"]],
  ["dune",["desert","sand","wind","camel","sun"]],
  ["elm",["bark","leaf","park","shade","tree","wood"]],
  ["fauna",["animal","bird","fish","forest","nature","wildlife"]],
  ["fern",["forest","green","grow","jungle","leaf","moss","shade"]],
  ["fjord",["cliff","cold","ice","mountain","ocean","water"]],
  ["flora",["bloom","flower","garden","green","plant","spring"]],
  ["foliage",["autumn","forest","gold","green","leaf","tree"]],
  ["geyser",["earth","heat","steam","volcano","water"]],
  ["glen",["forest","hill","meadow","river","valley"]],
  ["gorge",["canyon","cliff","mountain","river","rock","water"]],
  ["grove",["forest","fruit","garden","olive","shade","tree"]],
  ["hedge",["bird","bush","fence","garden","green","leaf"]],
  ["herb",["garden","green","heal","leaf","medicine","sage","tea"]],
  ["ivy",["climb","green","grow","leaf","vine","wall"]],
  ["lagoon",["beach","blue","fish","island","ocean","water"]],
  ["lava",["ash","earth","fire","heat","red","rock","volcano"]],
  ["lichen",["moss","rock","stone","tree","green"]],
  ["lily",["flower","frog","garden","lake","pond","water","white"]],
  ["maple",["autumn","gold","leaf","red","sugar","tree","wood"]],
  ["marsh",["bog","duck","frog","reed","swamp","water"]],
  ["meadow",["bloom","butterfly","clover","field","flower","grass","spring"]],
  ["mist",["dawn","dew","fog","ghost","mountain","morning","rain","water"]],
  ["moss",["forest","green","grow","lichen","rock","stone","tree"]],
  ["oasis",["camel","desert","palm","sand","sun","water"]],
  ["orchid",["exotic","flower","garden","jungle","purple","tropical"]],
  ["palm",["beach","coconut","island","sun","tree","tropical"]],
  ["peak",["climb","cloud","eagle","mountain","snow","summit"]],
  ["pebble",["beach","river","rock","sand","stone","water"]],
  ["pine",["cone","forest","green","mountain","needle","tree","winter","wood"]],
  ["plateau",["desert","earth","flat","mesa","mountain","rock"]],
  ["pond",["duck","fish","frog","lily","reed","water"]],
  ["prairie",["buffalo","field","grass","horizon","meadow","wind"]],
  ["reed",["bamboo","flute","marsh","music","pond","river","water","wind"]],
  ["reef",["coral","fish","ocean","shark","tropical","water"]],
  ["ridge",["cliff","mountain","peak","rock","summit","wind"]],
  ["root",["earth","grow","oak","seed","tree","water","wood"]],
  ["savanna",["elephant","grass","lion","sun","tree","zebra"]],
  ["shrub",["bird","bush","garden","green","leaf","thorn"]],
  ["slope",["hill","mountain","ski","snow","valley"]],
  ["sprout",["bud","garden","green","grow","seed","spring"]],
  ["steppe",["cold","grass","horse","plain","wind"]],
  ["summit",["climb","cloud","eagle","mountain","peak","snow","wind"]],
  ["swamp",["bog","crocodile","frog","marsh","mud","snake","water"]],
  ["thicket",["bird","bush","forest","thorn","tree","wood"]],
  ["tide",["beach","moon","ocean","salt","sand","sea","wave","water"]],
  ["timber",["axe","forest","lumber","oak","tree","wood"]],
  ["trail",["forest","hike","mountain","path","walk","wilderness"]],
  ["tundra",["arctic","bear","cold","ice","moss","snow","wind","winter"]],
  ["vale",["flower","glen","meadow","river","valley"]],
  ["valley",["glen","hill","mountain","river","stream","vale"]],
  ["vine",["climb","grape","green","grow","ivy","wall","wine"]],
  ["waterfall",["cliff","mist","mountain","rainbow","river","rock","water"]],
  ["wetland",["bird","duck","frog","marsh","reed","water"]],
  ["willow",["green","lake","leaf","river","shade","tree","water","weep"]],
  ["wood",["axe","bark","birch","branch","carpenter","fire","forest","oak","pine","tree"]],
],

// ═══════════════════════════════════════════
//  ANIMALS (expand from 38 → ~100)
// ═══════════════════════════════════════════
animals: [
  ["ape",["banana","climb","forest","gorilla","jungle","monkey","tree"]],
  ["badger",["burrow","claw","dig","earth","forest","stripe"]],
  ["bat",["cave","dark","echo","fly","moon","night","vampire","wing"]],
  ["beaver",["dam","lake","river","swim","tree","water","wood"]],
  ["bison",["buffalo","grass","horn","plain","prairie"]],
  ["boar",["forest","hunt","pig","thorn","tusk","wild"]],
  ["buffalo",["bison","grass","horn","plain","prairie","savanna"]],
  ["camel",["desert","dune","hump","oasis","sand","sun"]],
  ["canary",["bird","cage","gold","melody","sing","yellow"]],
  ["chameleon",["color","hide","jungle","lizard","tree"]],
  ["cheetah",["fast","hunt","leopard","run","savanna","speed"]],
  ["cobra",["dance","fang","hood","poison","snake","venom"]],
  ["cockatoo",["bird","feather","parrot","sing","white","wing"]],
  ["colt",["farm","fast","horse","run","young"]],
  ["condor",["bird","cliff","fly","mountain","sky","wing"]],
  ["coral",["fish","ocean","reef","sea","tropical","water"]],
  ["cougar",["cat","claw","hunt","mountain","wild"]],
  ["coyote",["desert","howl","moon","night","wild","wolf"]],
  ["crane",["bird","dance","fly","lake","water","wing"]],
  ["crocodile",["jaw","river","scale","swamp","teeth","water"]],
  ["deer",["antler","forest","gentle","hunt","meadow","run","spring"]],
  ["dolphin",["fish","intelligent","jump","ocean","play","swim","wave","water"]],
  ["donkey",["farm","load","mule","path","stubborn"]],
  ["dove",["bird","feather","fly","love","olive","peace","white","wing"]],
  ["dragonfly",["fly","garden","insect","iridescent","pond","summer","water","wing"]],
  ["eel",["electric","fish","ocean","river","slippery","water"]],
  ["elephant",["ivory","jungle","memory","savanna","trunk","tusk","wise"]],
  ["elk",["antler","deer","forest","horn","hunt","mountain"]],
  ["falcon",["bird","claw","dive","fast","feather","fly","hunt","sky","wing"]],
  ["finch",["bird","garden","melody","seed","sing","tree"]],
  ["firefly",["glow","grass","light","meadow","night","summer"]],
  ["flamingo",["bird","dance","lake","leg","pink","tropical","water"]],
  ["fox",["clever","forest","fur","hunt","orange","red","tail","wild"]],
  ["gazelle",["deer","fast","grass","hunt","leap","run","savanna"]],
  ["gecko",["climb","lizard","night","scale","wall"]],
  ["giraffe",["Africa","leaf","neck","savanna","tall","tree"]],
  ["goat",["cheese","climb","farm","horn","milk","mountain"]],
  ["gorilla",["ape","climb","forest","jungle","mighty","strong"]],
  ["grasshopper",["field","grass","green","hop","insect","jump","meadow","summer"]],
  ["hare",["fast","field","meadow","moon","rabbit","run","snow"]],
  ["hawk",["bird","claw","eye","fly","hunt","sky","wind","wing"]],
  ["hedgehog",["garden","leaf","needle","night","spine","thorn"]],
  ["heron",["bird","blue","fish","lake","leg","river","water"]],
  ["hippo",["heavy","mud","river","swim","water"]],
  ["hound",["chase","dog","fox","hunt","loyal","run","wolf"]],
  ["hummingbird",["bird","fast","flower","fly","garden","nectar","tiny","wing"]],
  ["hyena",["hunt","laugh","night","pack","savanna","wild"]],
  ["iguana",["climb","green","lizard","scale","sun","tropical"]],
  ["impala",["deer","fast","gazelle","grass","jump","leap","savanna"]],
  ["jackal",["desert","howl","hunt","night","pack","wild","wolf"]],
  ["jaguar",["cat","claw","fast","hunt","jungle","leopard","night","spot","swim"]],
  ["jay",["bird","blue","feather","forest","loud","tree"]],
  ["jellyfish",["glow","ocean","sting","swim","transparent","water"]],
  ["kangaroo",["hop","jump","kick","outback","pouch","tail"]],
  ["kingfisher",["bird","blue","dive","fish","river","water"]],
  ["koala",["Australia","climb","eucalyptus","fur","sleep","tree"]],
  ["ladybug",["garden","insect","luck","red","spot"]],
  ["lamb",["farm","gentle","innocent","sheep","soft","spring","white","wool"]],
  ["lemur",["climb","eye","island","jungle","monkey","night","tail","tree"]],
  ["leopard",["cat","claw","fast","hunt","jaguar","night","spot","tree"]],
  ["lion",["brave","claw","crown","hunt","king","mane","pride","roar","savanna","strong"]],
  ["lizard",["chameleon","gecko","iguana","scale","sun","tail","wall"]],
  ["llama",["climb","fur","mountain","pack","spit","wool"]],
  ["lobster",["claw","cook","ocean","red","sea","shell","water"]],
  ["lynx",["cat","ear","forest","hunt","snow","wild","winter"]],
  ["macaw",["bird","bright","feather","jungle","parrot","tropical"]],
  ["mammoth",["ancient","cold","elephant","extinct","fur","ice","ivory","tusk"]],
  ["mole",["blind","burrow","dark","dig","earth","tunnel"]],
  ["monkey",["ape","banana","climb","forest","jungle","tail","tree"]],
  ["moose",["antler","cold","elk","forest","lake","winter"]],
  ["moth",["butterfly","dark","flame","fly","light","moon","night","silk","wing"]],
  ["nightingale",["bird","melody","moon","night","sing","song","spring"]],
  ["octopus",["arm","deep","ink","intelligent","ocean","sea","swim","tentacle","water"]],
  ["osprey",["bird","claw","dive","eagle","fish","fly","river","water","wing"]],
  ["otter",["fish","fur","lake","play","river","slide","swim","water"]],
  ["ox",["bull","farm","field","horn","plow","strong"]],
  ["oyster",["clam","ocean","pearl","salt","sea","shell","water"]],
  ["panda",["bamboo","bear","black","China","fur","white"]],
  ["panther",["black","cat","claw","hunt","jaguar","jungle","night","shadow"]],
  ["peacock",["bird","blue","dance","eye","feather","green","pride","tail"]],
  ["pelican",["beak","bird","dive","fish","ocean","water","wing"]],
  ["penguin",["black","cold","dive","fish","ice","slide","snow","swim","water","white","winter"]],
  ["pigeon",["bird","city","fly","message","peace","roof","wing"]],
  ["piranha",["bite","blood","fish","jungle","river","teeth","water"]],
  ["pony",["colt","farm","horse","mane","ride","small","tail"]],
  ["porcupine",["needle","quill","sharp","spine","thorn","wild"]],
  ["puma",["cat","climb","cougar","hunt","mountain","speed","wild"]],
  ["quail",["bird","egg","farm","feather","fly","hunt"]],
  ["rabbit",["burrow","carrot","ear","fast","field","fur","hare","hop","meadow","soft"]],
  ["raccoon",["clever","mask","night","stripe","trash","tree","wild"]],
  ["raven",["bird","black","clever","crow","dark","feather","mystery","night","shadow"]],
  ["rhino",["Africa","charge","horn","mighty","savanna","strong","thick"]],
  ["robin",["bird","breast","garden","nest","red","sing","spring","tree"]],
  ["rooster",["chicken","crow","dawn","farm","morning","wake"]],
  ["salamander",["fire","forest","lizard","stream","water","wet"]],
  ["salmon",["cook","fish","leap","ocean","pink","river","swim","upstream","water"]],
  ["scorpion",["claw","desert","poison","sand","sting","tail","venom"]],
  ["seagull",["beach","bird","cry","fish","fly","ocean","sand","wave","white"]],
  ["seahorse",["curl","horse","ocean","sea","small","swim","tail","water"]],
  ["seal",["beach","cold","dive","fish","ice","ocean","play","swim","water"]],
  ["shark",["bite","blood","deep","fear","fin","fish","hunt","jaw","ocean","teeth","water"]],
  ["snail",["garden","rain","shell","slow","slime","spiral","trail"]],
  ["sparrow",["bird","bread","city","fly","garden","nest","seed","sing","small","tree"]],
  ["spider",["crawl","dark","fear","fly","silk","spin","trap","web"]],
  ["squid",["deep","ink","ocean","sea","swim","tentacle","water"]],
  ["stag",["antler","deer","forest","horn","hunt","king","noble","run"]],
  ["stork",["baby","bird","fly","leg","nest","river","spring","white"]],
  ["swan",["bird","elegant","feather","grace","lake","white","wing"]],
  ["tiger",["bamboo","cat","claw","hunt","jungle","orange","roar","stripe","strong"]],
  ["toad",["frog","garden","hop","mud","night","pond","rain","wart"]],
  ["toucan",["beak","bird","bright","fruit","jungle","tropical"]],
  ["trout",["brook","fish","fly","fresh","lake","river","stream","swim","water"]],
  ["viper",["bite","cobra","fang","poison","scale","snake","venom"]],
  ["vulture",["bird","bone","circle","death","desert","fly","sky"]],
  ["walrus",["arctic","cold","fat","ice","ocean","seal","tusk"]],
  ["wasp",["fly","garden","insect","nest","sting","summer","yellow"]],
  ["weasel",["burrow","clever","fast","fur","hunt","small","thin"]],
  ["whale",["blue","deep","dive","giant","ocean","sing","song","swim","tail","water"]],
  ["wolf",["bark","forest","howl","hunt","moon","night","pack","run","snow","wild","winter"]],
  ["worm",["apple","bird","dig","earth","fish","garden","mud","rain","soil"]],
  ["zebra",["Africa","black","fast","horse","run","savanna","stripe","white"]],
],

// ═══════════════════════════════════════════
//  OBJECTS (expand from 73 → ~130)
// ═══════════════════════════════════════════
objects: [
  ["axe",["chop","iron","lumberjack","timber","tool","tree","wood"]],
  ["basket",["bread","carry","flower","fruit","picnic","weave"]],
  ["blanket",["bed","comfort","sleep","soft","warm","winter","wool"]],
  ["bolt",["door","fast","iron","lightning","lock","nut","screw","thunder"]],
  ["bone",["body","death","dig","dog","ivory","skeleton","skull"]],
  ["bottle",["cork","glass","message","water","wine"]],
  ["brick",["build","house","red","stone","wall"]],
  ["broom",["clean","dust","fly","sweep","witch","wood"]],
  ["bucket",["carry","dig","metal","sand","water","well"]],
  ["candle",["dark","fire","flame","light","melt","wax","wick"]],
  ["carpet",["color","floor","pattern","silk","soft","weave"]],
  ["cart",["carry","farm","horse","load","wheel","wood"]],
  ["chest",["gold","heart","lock","pirate","treasure","wood"]],
  ["chisel",["carve","craft","marble","sculptor","stone","tool"]],
  ["clock",["bell","gear","hand","hour","tick","time","tower"]],
  ["coin",["copper","flip","gold","metal","money","round","silver","treasure"]],
  ["comb",["brush","hair","honey","wave"]],
  ["compass",["direction","explore","magnet","map","north","navigate","travel"]],
  ["cradle",["baby","rock","sleep","swing","wood"]],
  ["crystal",["cave","clear","gem","glass","ice","light","magic","quartz","shine"]],
  ["curtain",["cloth","hide","silk","stage","theater","window"]],
  ["dagger",["blade","blood","knife","sharp","steel","stab"]],
  ["dice",["chance","game","luck","number","roll","six"]],
  ["envelope",["letter","mail","message","paper","seal","stamp","write"]],
  ["fan",["breeze","cool","dance","paper","silk","wind"]],
  ["flask",["bottle","drink","glass","liquid","metal","potion","water"]],
  ["frame",["art","border","gold","paint","photo","picture","wood"]],
  ["gear",["clock","engine","iron","machine","metal","spin","wheel"]],
  ["globe",["earth","geography","map","round","spin","travel","world"]],
  ["goblet",["cup","drink","glass","gold","king","silver","wine"]],
  ["hammer",["anvil","blacksmith","build","iron","nail","stone","tool"]],
  ["harp",["angel","gold","melody","music","string","tune","wing"]],
  ["inkwell",["black","feather","ink","pen","quill","write"]],
  ["jar",["clay","glass","honey","jam","lid","preserve","store"]],
  ["jug",["carry","clay","handle","pour","water","wine"]],
  ["kettle",["boil","copper","fire","hot","steam","tea","water"]],
  ["kite",["breeze","child","color","fly","sky","string","tail","wind"]],
  ["ladder",["climb","height","rope","step","tool","wood"]],
  ["lantern",["candle","dark","fire","glow","light","night","oil"]],
  ["locket",["chain","gold","heart","jewel","memory","neck","secret"]],
  ["loom",["cloth","craft","pattern","silk","thread","weave","wool"]],
  ["mallet",["drum","hammer","hit","tool","wood"]],
  ["mattress",["bed","comfort","feather","sleep","soft"]],
  ["mortar",["brick","build","crush","grind","herb","stone"]],
  ["mug",["ceramic","clay","coffee","cup","drink","hot","tea"]],
  ["nail",["build","hammer","iron","metal","sharp","tool","wood"]],
  ["net",["catch","fish","knot","rope","spider","trap","web"]],
  ["oar",["boat","paddle","river","row","water","wood"]],
  ["paddle",["boat","canoe","oar","river","row","water"]],
  ["pail",["bucket","carry","metal","sand","water"]],
  ["pedal",["bicycle","cycle","foot","push","ride","spin","wheel"]],
  ["pillow",["bed","comfort","feather","head","sleep","soft"]],
  ["plank",["bridge","build","pirate","ship","walk","wood"]],
  ["plate",["ceramic","clay","dish","eat","food","glass","round"]],
  ["pliers",["grip","iron","metal","pull","tool","wire"]],
  ["pot",["boil","clay","cook","earth","fire","flower","garden","gold","water"]],
  ["pulley",["lift","machine","rope","weight","wheel"]],
  ["quiver",["arrow","bow","hunt","leather","shake"]],
  ["raft",["float","log","ocean","river","sail","water","wood"]],
  ["reel",["catch","fish","line","rod","spin","thread"]],
  ["rod",["cast","fish","iron","metal","staff","straight"]],
  ["saddle",["horse","leather","ride","seat","stirrup"]],
  ["saw",["blade","carpenter","cut","sharp","teeth","tool","wood"]],
  ["scale",["balance","fish","justice","measure","music","snake","weight"]],
  ["scissors",["blade","cloth","cut","hair","paper","sharp","tool"]],
  ["shovel",["dig","earth","garden","gold","sand","snow","soil","tool"]],
  ["sickle",["crop","cut","farm","grain","harvest","moon"]],
  ["spool",["cotton","needle","spin","thread","weave"]],
  ["staff",["magic","rod","walk","wizard","wood"]],
  ["stirrup",["boot","horse","iron","kick","ride","saddle"]],
  ["stool",["chair","foot","leg","seat","short","wood"]],
  ["strap",["belt","bind","buckle","leather","tie"]],
  ["thread",["cotton","needle","sew","silk","spool","thin","weave"]],
  ["tongs",["blacksmith","fire","grab","grip","hot","iron","metal","tool"]],
  ["torch",["cave","dark","fire","flame","light","night","oil","run"]],
  ["trap",["catch","clever","hunt","net","spider","web"]],
  ["tray",["carry","food","glass","plate","serve","silver"]],
  ["tripod",["camera","leg","stand","steady","three"]],
  ["vase",["ceramic","clay","flower","glass","water"]],
  ["veil",["bride","cloth","face","hide","mystery","silk","white"]],
  ["wagon",["carry","farm","horse","load","trail","wheel","wood"]],
  ["wheel",["cart","circle","gear","roll","round","spin","turn","wagon"]],
  ["whip",["crack","horse","leather","sting","wind"]],
  ["wick",["burn","candle","fire","flame","light","oil"]],
  ["wrench",["bolt","grip","iron","metal","nut","tool","turn"]],
],

// ═══════════════════════════════════════════
//  ABSTRACT (expand from 48 → ~90)
// ═══════════════════════════════════════════
abstract: [
  ["bliss",["happy","heaven","joy","love","paradise","peace"]],
  ["bond",["chain","connect","friend","glue","knot","link","love","tie"]],
  ["chance",["dice","fate","gamble","luck","random","risk"]],
  ["chaos",["dark","disorder","fire","storm","void","wild"]],
  ["charm",["beauty","grace","jewel","luck","magic","spell"]],
  ["choice",["branch","door","fate","fork","path","risk"]],
  ["craft",["art","build","create","hand","skill","tool"]],
  ["cycle",["circle","moon","repeat","season","spin","sun","time","wheel"]],
  ["dawn",["bird","dew","east","light","morning","rise","sun","wake"]],
  ["decay",["dark","death","dust","fall","mold","rot","time","wither"]],
  ["echo",["canyon","cave","hollow","mountain","repeat","sound","voice"]],
  ["enigma",["dark","mystery","puzzle","riddle","secret","shadow"]],
  ["fate",["chance","death","destiny","doom","fortune","karma","star","time"]],
  ["flow",["brook","current","liquid","river","smooth","stream","water","wind"]],
  ["flux",["change","flow","liquid","metal","melt","shift","time"]],
  ["folly",["fool","jest","laugh","madness","play","risk"]],
  ["glory",["crown","gold","hero","honor","king","light","shine","sun","victory","war"]],
  ["grace",["angel","beauty","dance","elegant","flow","light","swan"]],
  ["grief",["black","cry","dark","death","loss","mourn","pain","sorrow","tear"]],
  ["grit",["dust","earth","hard","persevere","sand","stone","strong","tough"]],
  ["haze",["blur","dawn","dream","fog","heat","mist","smoke","summer"]],
  ["honor",["badge","brave","glory","gold","hero","knight","noble","oath","sword"]],
  ["instinct",["animal","feel","gut","hunt","natural","primal","sense","wild"]],
  ["jest",["clown","comedy","fool","fun","jester","joke","laugh","play"]],
  ["lore",["ancient","book","legend","myth","old","sage","story","wisdom"]],
  ["luck",["chance","charm","clover","dice","fate","fortune","gold","star"]],
  ["mercy",["angel","forgive","gentle","grace","heart","kind","peace"]],
  ["muse",["art","create","dream","inspire","music","paint","poetry","sing","think"]],
  ["myth",["ancient","dragon","god","hero","legend","lore","monster","phoenix","story","tale"]],
  ["noble",["brave","crown","gold","hero","honor","king","knight","royal"]],
  ["oath",["blood","bond","honor","knight","promise","ring","sacred","sword","vow"]],
  ["omen",["black","cat","crow","dark","fate","moon","raven","sign","star"]],
  ["origin",["ancient","birth","create","dawn","earth","first","root","seed","source"]],
  ["paradox",["enigma","loop","mirror","opposite","puzzle","riddle"]],
  ["plea",["ask","cry","heart","hope","mercy","prayer"]],
  ["plight",["dark","doom","fate","struggle","suffer","trouble"]],
  ["pride",["honor","king","lion","noble","peacock","royal","strong"]],
  ["quest",["adventure","brave","hero","journey","knight","search","seek","treasure"]],
  ["riddle",["answer","enigma","mystery","puzzle","question","secret","sphinx"]],
  ["ruin",["ancient","castle","decay","fall","stone","time","war"]],
  ["saga",["adventure","epic","hero","legend","story","tale","viking","warrior"]],
  ["serenity",["calm","garden","lake","moon","peace","quiet","still","water","zen"]],
  ["shadow",["black","dark","follow","ghost","light","moon","night","shade","sun"]],
  ["solace",["calm","comfort","heart","hope","peace","quiet"]],
  ["surge",["crash","energy","flow","ocean","power","rise","storm","tide","wave"]],
  ["trance",["deep","dream","gaze","hypnosis","magic","meditation","sleep","spell"]],
  ["valor",["brave","courage","fight","hero","honor","knight","strong","sword","war"]],
  ["vigil",["candle","dark","guard","light","night","pray","watch"]],
  ["virtue",["angel","gold","good","grace","honor","light","noble","pure"]],
  ["woe",["cry","dark","grief","pain","sorrow","tear","trouble"]],
  ["wonder",["awe","child","magic","marvel","miracle","question","star"]],
  ["zenith",["apex","high","noon","peak","sky","star","summit","sun","top"]],
],

// ═══════════════════════════════════════════
//  EMOTIONS (expand from 27 → ~60)
// ═══════════════════════════════════════════
emotions: [
  ["agony",["cry","dark","fire","pain","scream","suffer","tear"]],
  ["awe",["beauty","giant","marvel","mighty","sky","star","wonder"]],
  ["blush",["cheek","pink","red","rose","shy"]],
  ["calm",["blue","lake","ocean","peace","quiet","serenity","still","water","zen"]],
  ["contempt",["anger","cold","dark","pride","scorn","sneer"]],
  ["craving",["desire","dream","hunger","need","thirst","want"]],
  ["delight",["dance","happy","joy","laugh","light","play","smile","sweet"]],
  ["despair",["abyss","dark","doom","grief","hope","shadow","sorrow","void"]],
  ["dread",["dark","deep","doom","fear","horror","night","shadow"]],
  ["ecstasy",["bliss","dance","fly","heaven","joy","light","love"]],
  ["empathy",["connect","feel","heart","kind","love","mirror","soul","understand"]],
  ["euphoria",["bliss","dance","ecstasy","fly","happy","joy","light"]],
  ["fury",["anger","fire","rage","red","roar","storm","tempest","wild"]],
  ["gloom",["cloud","dark","gray","rain","sad","shadow","sorrow"]],
  ["guilt",["burden","dark","heavy","heart","regret","shame","weight"]],
  ["hesitation",["doubt","edge","fear","pause","wait"]],
  ["hysteria",["chaos","cry","fear","laugh","madness","panic","scream"]],
  ["jealousy",["envy","fire","green","heart","poison","rage"]],
  ["jubilation",["celebrate","cheer","dance","happy","joy","victory"]],
  ["longing",["desire","distant","dream","heart","horizon","miss","moon","wait"]],
  ["melancholy",["autumn","blue","dark","moon","rain","sad","sorrow","tear"]],
  ["nostalgia",["home","memory","old","photo","past","warm"]],
  ["panic",["chaos","crowd","fear","flight","heart","hysteria","run","scream"]],
  ["passion",["dance","desire","fire","flame","heart","love","music","red"]],
  ["pity",["compassion","empathy","gentle","heart","kind","mercy","sorrow","tear"]],
  ["remorse",["dark","guilt","heart","pain","regret","shame","sorrow"]],
  ["resentment",["anger","bitter","cold","dark","fire","grudge","poison"]],
  ["shame",["blush","dark","guilt","hide","red","regret"]],
  ["shock",["electric","fear","freeze","jolt","lightning","pale","surprise","white"]],
  ["sympathy",["comfort","empathy","gentle","heart","kind","love","warm"]],
  ["thrill",["adventure","danger","electric","fast","heart","rush","speed"]],
  ["torment",["agony","dark","fire","hell","pain","suffer"]],
  ["tranquility",["calm","garden","lake","peace","quiet","serenity","still","zen"]],
  ["triumph",["crown","glory","gold","hero","victory","win"]],
  ["warmth",["blanket","comfort","fire","glow","heart","hug","love","sun"]],
  ["wrath",["anger","fire","fury","god","lightning","rage","red","storm","thunder"]],
  ["yearning",["desire","distant","dream","heart","longing","miss","moon","reach"]],
  ["zeal",["energy","fire","flame","focus","mission","passion","spirit"]],
],

// ═══════════════════════════════════════════
//  ELEMENTS (expand from 29 → ~55)
// ═══════════════════════════════════════════
elements: [
  ["acid",["burn","corrode","green","liquid","poison","rain","sting"]],
  ["alloy",["bronze","copper","gold","iron","metal","mix","silver","steel","tin"]],
  ["charcoal",["ash","black","burn","coal","draw","fire","sketch","wood"]],
  ["cinder",["ash","burn","coal","ember","fire","hot","smoke"]],
  ["clay",["brick","earth","mold","mud","pot","red","shape","vase","water","wet"]],
  ["cobalt",["blue","metal","mineral","paint"]],
  ["ember",["ash","burn","coal","fire","glow","hot","light","orange","red","warm"]],
  ["emerald",["gem","green","jewel","mine","precious","ring","shine"]],
  ["flint",["fire","rock","sharp","spark","stone","tool"]],
  ["fossil",["ancient","bone","dinosaur","earth","old","rock","shell","stone","time"]],
  ["frost",["cold","crystal","glass","ice","morning","snow","white","winter"]],
  ["granite",["gray","hard","mountain","rock","stone","strong"]],
  ["jade",["carve","China","gem","green","jewel","stone"]],
  ["magma",["earth","fire","hot","lava","melt","red","rock","volcano"]],
  ["marble",["art","carve","chisel","cold","pillar","sculpture","smooth","stone","temple","white"]],
  ["mercury",["fast","liquid","metal","poison","silver","temperature","thermometer"]],
  ["mineral",["crystal","earth","gem","mine","rock","salt","stone"]],
  ["obsidian",["black","dark","glass","rock","sharp","stone","volcano"]],
  ["ore",["copper","earth","gold","iron","metal","mine","rock","silver"]],
  ["pearl",["clam","elegant","gem","jewel","moon","ocean","oyster","round","shell","white"]],
  ["peat",["bog","brown","burn","earth","fire","marsh","soil"]],
  ["pumice",["float","light","rock","stone","volcano"]],
  ["quartz",["clear","crystal","gem","mineral","rock","sand","stone"]],
  ["ruby",["blood","gem","jewel","precious","red","ring","shine"]],
  ["rust",["brown","decay","iron","metal","old","orange","red","time","water"]],
  ["sapphire",["blue","gem","jewel","precious","ring","shine","sky","star"]],
  ["soot",["ash","black","burn","chimney","coal","dark","fire","smoke"]],
  ["sulfur",["burn","fire","hot","smell","volcano","yellow"]],
  ["tin",["alloy","can","foil","metal","mine","silver","thin"]],
  ["topaz",["gem","gold","jewel","orange","precious","shine","yellow"]],
],

// ═══════════════════════════════════════════
//  FOOD (expand from 35 → ~70)
// ═══════════════════════════════════════════
food: [
  ["acorn",["oak","nut","seed","squirrel","tree","fall"]],
  ["almond",["cream","milk","nut","sweet","tree"]],
  ["barley",["beer","bread","farm","field","grain","harvest"]],
  ["basil",["cook","garden","green","herb","leaf","sauce"]],
  ["berry",["bird","bush","jam","juice","red","sweet","wild"]],
  ["biscuit",["bake","butter","crumb","flour","sweet","tea"]],
  ["broth",["boil","bone","cook","hot","salt","soup","warm","water"]],
  ["cake",["bake","birthday","butter","chocolate","cream","flour","sugar","sweet"]],
  ["cashew",["cream","milk","nut","roast","tree"]],
  ["chili",["fire","garden","hot","pepper","red","sauce","spice"]],
  ["cinnamon",["bark","brown","cook","spice","sugar","sweet","tea","warm"]],
  ["clam",["beach","ocean","pearl","salt","sand","sea","shell","water"]],
  ["coconut",["cream","island","milk","palm","shell","tropical","tree","water","white"]],
  ["corn",["crop","farm","field","gold","grain","harvest","summer","yellow"]],
  ["cranberry",["berry","bog","juice","marsh","red","tart"]],
  ["cream",["butter","cake","cloud","coffee","ice","milk","smooth","soft","white"]],
  ["crust",["bake","bread","earth","hard","pie","pizza"]],
  ["curry",["cook","gold","hot","India","rice","sauce","spice","yellow"]],
  ["date",["desert","fruit","palm","sweet","time","tree"]],
  ["dough",["bake","bread","flour","knead","rise","yeast"]],
  ["fig",["fruit","garden","leaf","mediterranean","sweet","tree"]],
  ["flour",["bake","bread","cake","dust","grain","mill","wheat","white"]],
  ["garlic",["cook","garden","herb","pungent","vampire","white"]],
  ["ginger",["cook","orange","root","spice","tea","warm"]],
  ["grape",["crush","fruit","harvest","juice","purple","vine","vineyard","wine"]],
  ["hazel",["brown","eye","nut","tree","wood"]],
  ["jam",["berry","bread","fruit","jar","red","spread","sugar","sweet"]],
  ["lemon",["acid","citrus","juice","sour","tree","yellow"]],
  ["lime",["citrus","cocktail","green","juice","sour","tree"]],
  ["mango",["fruit","juice","orange","sweet","tree","tropical","yellow"]],
  ["melon",["cool","fruit","green","juice","seed","summer","sweet","water"]],
  ["mint",["breath","cold","cool","fresh","green","herb","leaf","tea"]],
  ["mushroom",["cap","dark","earth","forest","grow","rain","umbrella"]],
  ["noodle",["boil","cook","dough","flour","soup","water"]],
  ["nut",["acorn","almond","cashew","crack","hazel","shell","squirrel","tree","walnut"]],
  ["olive",["dove","garden","green","grove","mediterranean","oil","peace","salt","tree"]],
  ["onion",["cook","cry","garden","layer","peel","ring","root","tear"]],
  ["peach",["fruit","fuzz","juice","pink","soft","summer","sweet","tree"]],
  ["pear",["autumn","fruit","green","juice","sweet","tree"]],
  ["pie",["apple","bake","cherry","crust","flour","sweet"]],
  ["plum",["autumn","dark","fruit","jam","juice","purple","sweet","tree"]],
  ["raisin",["dry","fruit","grape","sun","sweet","vine"]],
  ["rye",["beer","bread","field","grain","harvest","whiskey"]],
  ["sauce",["basil","cook","garlic","pour","red","spice","tomato"]],
  ["soup",["boil","bowl","broth","cook","hot","noodle","warm","water"]],
  ["stew",["beef","boil","cook","fire","hot","meat","pot","warm"]],
  ["syrup",["maple","pancake","pour","sticky","sugar","sweet","tree"]],
  ["thyme",["cook","garden","green","herb","leaf","spice"]],
  ["toast",["bread","breakfast","brown","butter","crisp","fire","warm"]],
  ["truffle",["chocolate","earth","forest","mushroom","pig","rare","rich"]],
  ["vanilla",["bean","cream","flower","ice","orchid","sweet","white"]],
  ["walnut",["brain","brown","crack","nut","shell","tree","wood"]],
  ["wheat",["bread","crop","farm","field","flour","gold","grain","harvest"]],
  ["yeast",["bake","bread","bubble","dough","ferment","rise"]],
],

// ═══════════════════════════════════════════
//  ACTIONS (expand from 47 → ~80)
// ═══════════════════════════════════════════
actions: [
  ["ascend",["climb","fly","mountain","rise","sky","soar","summit"]],
  ["bind",["chain","knot","rope","strap","thread","tie","wrap"]],
  ["carve",["chisel","craft","knife","marble","stone","tool","wood"]],
  ["chase",["dog","fast","hound","hunt","pursue","run","wolf"]],
  ["clash",["battle","fight","lightning","metal","sound","storm","sword","thunder","war"]],
  ["craft",["art","build","create","hand","make","shape","skill","tool"]],
  ["crawl",["baby","earth","ground","slow","snake","spider","worm"]],
  ["crumble",["cake","decay","dust","earth","fall","old","ruin","stone"]],
  ["crush",["grape","grind","press","squeeze","stone","strong","weight"]],
  ["dash",["fast","quick","race","run","speed","sprint"]],
  ["descend",["deep","dive","down","fall","slope","valley"]],
  ["devour",["consume","eat","fire","hunger","wolf"]],
  ["emerge",["appear","birth","dawn","rise","spring","surface","water"]],
  ["embrace",["arm","comfort","hug","love","warm","wrap"]],
  ["erode",["decay","rain","river","rock","sand","time","water","wind"]],
  ["fade",["autumn","color","dark","ghost","light","memory","shadow","time"]],
  ["feast",["banquet","celebrate","eat","food","king","table","wine"]],
  ["flee",["chase","danger","escape","fast","fear","fly","run"]],
  ["flutter",["bird","breeze","butterfly","fan","feather","flag","leaf","wing"]],
  ["forge",["anvil","blacksmith","craft","create","fire","hammer","iron","steel","sword"]],
  ["gallop",["fast","field","horse","ride","run","speed"]],
  ["glide",["bird","eagle","float","fly","ice","silk","slide","smooth","swan","wind"]],
  ["grind",["coffee","crush","gear","grain","mill","mortar","stone","teeth"]],
  ["guard",["castle","door","gate","knight","protect","shield","sword","vigil","watch"]],
  ["harvest",["autumn","corn","crop","farm","field","fruit","grain","wheat"]],
  ["ignite",["burn","fire","flame","light","match","spark"]],
  ["inspire",["art","create","dream","light","muse","spirit","star"]],
  ["kindle",["book","fire","flame","glow","ignite","light","spark","warm"]],
  ["kneel",["bow","ground","humble","king","knee","pray","submit"]],
  ["lure",["bait","catch","fish","hook","hunt","trap"]],
  ["meditate",["calm","mind","peace","quiet","spirit","still","think","zen"]],
  ["mend",["fix","heal","needle","patch","repair","sew","thread"]],
  ["migrate",["bird","fly","journey","move","season","south","travel","winter"]],
  ["navigate",["compass","map","north","sail","sea","ship","star"]],
  ["plunge",["deep","dive","fall","jump","ocean","swim","water"]],
  ["prowl",["cat","dark","hunt","night","shadow","stalk","wild"]],
  ["pursue",["chase","follow","hunt","quest","run","seek","trail"]],
  ["quench",["drink","fire","satisfy","thirst","water"]],
  ["reap",["crop","farm","grain","harvest","sickle","sow"]],
  ["retreat",["back","cave","forest","hide","mountain","peace","quiet","shelter"]],
  ["roam",["explore","field","free","journey","nomad","travel","wander","wild"]],
  ["scatter",["dust","fall","leaf","seed","spread","wind"]],
  ["shatter",["break","crystal","fall","glass","ice","mirror","smash","stone"]],
  ["shelter",["cave","home","house","rain","roof","safe","storm","tree","warm"]],
  ["shimmer",["crystal","dance","gem","gold","light","moon","shine","silk","star","water"]],
  ["sink",["deep","down","drown","fall","ocean","ship","water","weight"]],
  ["soar",["bird","cloud","eagle","fly","free","high","sky","wind","wing"]],
  ["sow",["farm","field","grain","plant","reap","seed","spring"]],
  ["stalk",["hunt","prey","prowl","shadow","silent","spider","tall","wheat"]],
  ["stir",["cook","mix","pot","soup","spoon","wake","water"]],
  ["summon",["bell","call","magic","power","ring","spirit","thunder","wizard"]],
  ["surge",["crash","energy","flow","ocean","power","rise","storm","tide","wave"]],
  ["swirl",["dance","mix","spin","spiral","storm","water","wind"]],
  ["tame",["beast","calm","gentle","horse","lion","train","wild"]],
  ["thaw",["ice","melt","snow","spring","sun","warm","water","winter"]],
  ["topple",["crash","crown","fall","king","push","ruin","tower"]],
  ["tremble",["cold","earth","earthquake","fear","quake","shake"]],
  ["unravel",["knot","mystery","puzzle","solve","thread","weave"]],
  ["vanish",["dark","disappear","fade","ghost","magic","mist","shadow","smoke"]],
  ["wander",["dream","explore","field","free","journey","lost","roam","trail"]],
  ["wilt",["autumn","decay","dry","fade","flower","heat","sun","wither"]],
  ["yield",["crop","farm","fruit","give","harvest","produce","submit"]],
],

// ═══════════════════════════════════════════
//  BODY (expand from 38 → ~60)
// ═══════════════════════════════════════════
body: [
  ["ankle",["bone","boot","chain","foot","joint","leg","run","step"]],
  ["beak",["bird","eagle","pelican","sharp","toucan"]],
  ["belly",["body","eat","fat","full","hunger","laugh","round"]],
  ["brow",["eye","face","frown","head","sweat","think"]],
  ["cheek",["blush","face","kiss","pink","red","smile","tear"]],
  ["chin",["beard","face","jaw","sharp"]],
  ["elbow",["arm","bend","bone","joint","push"]],
  ["fang",["bite","cobra","sharp","snake","teeth","vampire","venom","wolf"]],
  ["fingertip",["feel","hand","print","sensitive","touch"]],
  ["fist",["fight","grip","hand","punch","strong","tight"]],
  ["forehead",["brain","brow","face","head","sweat","think"]],
  ["gut",["belly","body","courage","feel","instinct","sense"]],
  ["heel",["boot","foot","kick","shoe","step","walk"]],
  ["hip",["body","bone","dance","joint","leg","swing"]],
  ["iris",["blue","color","eye","flower","green","purple","rainbow"]],
  ["jaw",["bite","bone","crocodile","face","mouth","shark","teeth"]],
  ["joint",["ankle","bend","bone","elbow","hip","knee"]],
  ["knuckle",["bone","crack","fist","finger","hand","punch"]],
  ["lip",["face","kiss","mouth","red","smile","speak","taste","whisper"]],
  ["marrow",["blood","bone","core","deep","essence","red"]],
  ["navel",["belly","body","center","core"]],
  ["nerve",["body","brain","electric","feel","pain","sense","touch"]],
  ["palm",["fortune","hand","line","read","tree","tropical"]],
  ["rib",["body","bone","cage","chest","heart","protect"]],
  ["scalp",["hair","head","skin"]],
  ["shin",["bone","kick","knee","leg","run"]],
  ["shoulder",["arm","body","bone","broad","burden","carry","heavy","strong"]],
  ["skull",["black","bone","brain","dead","death","head","pirate","skeleton"]],
  ["sole",["boot","bottom","fish","flat","foot","shoe","soul","walk"]],
  ["spine",["back","bone","book","needle","sharp","skeleton","strong","thorn"]],
  ["temple",["bell","brain","church","god","head","holy","pray","sacred","stone"]],
  ["tendon",["body","connect","muscle","pull","stretch","strong"]],
  ["thigh",["body","bone","hip","knee","leg","muscle","strong"]],
  ["throat",["breath","drink","neck","sing","swallow","voice","water"]],
  ["thumb",["finger","grip","hand","hold","press"]],
  ["tongue",["fire","flame","language","lick","mouth","speak","taste"]],
  ["torso",["arm","body","chest","core","hip","leg","shoulder"]],
  ["vein",["blood","blue","body","flow","heart","leaf","mine","river"]],
  ["waist",["belt","body","hip","middle","narrow","thin"]],
  ["womb",["baby","birth","body","mother","warm"]],
  ["wrist",["band","bone","bracelet","chain","hand","pulse","watch"]],
],

// ═══════════════════════════════════════════
//  PLACES (expand from 24 → ~55)
// ═══════════════════════════════════════════
places: [
  ["alley",["cat","city","dark","narrow","shadow","street","wall"]],
  ["arena",["battle","crowd","fight","gladiator","roar","sand","war"]],
  ["attic",["box","cobweb","dark","dust","house","memory","old","roof","spider"]],
  ["balcony",["flower","garden","house","romeo","star","view","wall"]],
  ["barn",["cow","farm","hay","horse","roof","wood"]],
  ["bazaar",["carpet","crowd","gold","jewel","market","silk","spice"]],
  ["cabin",["forest","log","mountain","shelter","snow","winter","wood"]],
  ["cellar",["barrel","cold","dark","deep","underground","wine"]],
  ["chapel",["bell","candle","church","pray","sacred","stone","wedding"]],
  ["citadel",["castle","fortress","guard","king","stone","tower","wall","war"]],
  ["cloister",["garden","monk","peace","quiet","stone","wall"]],
  ["colosseum",["ancient","arena","battle","gladiator","Rome","stone"]],
  ["courtyard",["castle","fountain","garden","palace","stone","tree","wall"]],
  ["den",["bear","cave","dark","fox","hide","lair","lion","secret","wolf"]],
  ["dock",["anchor","boat","harbor","rope","sail","sea","ship","water"]],
  ["dungeon",["castle","chain","cold","dark","dragon","guard","lock","prison","stone"]],
  ["gallery",["art","frame","museum","paint","photo","picture","wall"]],
  ["hamlet",["cottage","farm","field","quiet","small","village"]],
  ["haven",["harbor","peace","port","safe","shelter","ship"]],
  ["hearth",["fire","flame","glow","home","stone","warm"]],
  ["inn",["ale","bed","door","fire","meal","rest","sleep","tavern","travel"]],
  ["isle",["beach","island","ocean","palm","sand","sea","water"]],
  ["keep",["castle","guard","hold","king","stone","tower","wall"]],
  ["lair",["cave","dark","den","dragon","hide","monster","secret"]],
  ["library",["book","dust","knowledge","old","quiet","read","scroll","wisdom","write"]],
  ["lighthouse",["beam","cliff","coast","fog","guide","light","ocean","sail","sea","tower"]],
  ["manor",["garden","gate","hall","house","noble","old","room","stone"]],
  ["mill",["flour","grain","river","spin","water","wheat","wheel","wind"]],
  ["monastery",["bell","monk","mountain","peace","pray","quiet","sacred","stone"]],
  ["palace",["courtyard","crown","gold","guard","king","noble","queen","rich","royal","throne"]],
  ["pier",["boat","dock","fish","harbor","ocean","plank","sea","water","wood"]],
  ["plaza",["city","crowd","fountain","market","square","stone"]],
  ["port",["anchor","dock","harbor","sail","sea","ship","trade","water"]],
  ["quarry",["dig","earth","mine","rock","stone"]],
  ["ruins",["ancient","castle","decay","old","ruin","stone","time","wall"]],
  ["sanctuary",["holy","peace","pray","sacred","safe","shelter","temple"]],
  ["tavern",["ale","beer","drink","fire","inn","mug","song"]],
  ["terrace",["garden","house","step","stone","sun","view","vine"]],
  ["throne",["crown","gold","king","noble","palace","power","queen","royal","seat"]],
  ["tower",["bell","castle","clock","guard","high","king","lighthouse","stone","tall","wall"]],
  ["vault",["bank","gold","lock","safe","secret","stone","treasure","underground"]],
  ["vineyard",["grape","harvest","sun","vine","wine"]],
  ["wharf",["boat","dock","fish","harbor","pier","rope","sea","ship","water"]],
],

// ═══════════════════════════════════════════
//  COLORS (expand from 15 → ~30)
// ═══════════════════════════════════════════
colors: [
  ["azure",["blue","cloud","ocean","sky","water"]],
  ["beige",["brown","cream","desert","neutral","sand","soft"]],
  ["bronze",["bell","brown","copper","medal","metal","shield","statue","sun"]],
  ["burgundy",["dark","deep","grape","red","rich","velvet","wine"]],
  ["cobalt",["blue","deep","metal","paint"]],
  ["coral",["ocean","orange","pink","reef","sea","tropical","warm"]],
  ["crimson",["blood","dark","deep","passion","red","rose","ruby","war"]],
  ["cyan",["blue","bright","cool","ice","sky","water"]],
  ["ebony",["black","dark","deep","piano","rich","smooth","wood"]],
  ["emerald",["gem","green","jewel","precious","rich","shine"]],
  ["fuchsia",["bright","flower","pink","purple","vibrant"]],
  ["ivory",["bone","cream","elephant","pale","piano","smooth","tusk","white"]],
  ["lavender",["calm","field","flower","light","purple","scent","soft"]],
  ["magenta",["bright","flower","pink","purple","vibrant"]],
  ["maroon",["brown","dark","deep","red","rich","warm"]],
  ["navy",["blue","dark","deep","ocean","sea","uniform"]],
  ["ochre",["brown","earth","gold","paint","warm","yellow"]],
  ["scarlet",["blood","bright","crimson","fire","passion","red"]],
  ["silver",["blade","bright","coin","cool","metal","mirror","moon","shine","star","white"]],
  ["teal",["blue","calm","cool","deep","green","ocean","water"]],
  ["turquoise",["blue","gem","green","jewel","ocean","stone","tropical","water"]],
  ["vermilion",["bright","fire","orange","paint","red","warm"]],
  ["violet",["flower","lavender","purple","shy","soft","spring"]],
],

// ═══════════════════════════════════════════
//  PROFESSIONS (expand from 16 → ~40)
// ═══════════════════════════════════════════
professions: [
  ["alchemist",["fire","gold","magic","mercury","philosopher","potion","transform"]],
  ["archer",["arrow","bow","forest","hunt","target","war","weapon"]],
  ["astronomer",["galaxy","moon","night","planet","sky","star","telescope"]],
  ["baker",["bread","cake","dough","flour","oven","sugar","wheat","yeast"]],
  ["bard",["harp","legend","lore","lute","melody","poem","sing","song","story","tale"]],
  ["brewer",["ale","barley","barrel","beer","grain","hop","malt","tavern"]],
  ["butcher",["blade","cut","knife","meat","sharp"]],
  ["captain",["anchor","command","helm","sail","sea","ship","voyage"]],
  ["carpenter",["build","chisel","hammer","nail","saw","tool","wood"]],
  ["cartographer",["compass","explore","globe","map","navigate","travel","world"]],
  ["chef",["cook","fire","kitchen","knife","recipe","sauce","spice","taste"]],
  ["clockmaker",["clock","gear","hand","hour","tick","time","tool"]],
  ["diplomat",["crown","king","peace","queen","treaty","trust","word"]],
  ["explorer",["adventure","compass","discover","journey","map","navigate","quest","travel","world"]],
  ["fisherman",["boat","catch","fish","hook","net","ocean","river","sea","water"]],
  ["gardener",["bloom","dig","earth","flower","garden","green","grow","plant","seed","water"]],
  ["gladiator",["arena","battle","fight","Roman","shield","sword","war"]],
  ["healer",["herb","magic","medicine","potion","sage","spell","wound"]],
  ["herbalist",["garden","green","heal","herb","leaf","medicine","plant","potion","tea"]],
  ["jeweler",["diamond","gem","gold","jewel","precious","ring","silver","stone"]],
  ["knight",["armor","brave","castle","dragon","helmet","honor","horse","king","shield","sword","valor","war"]],
  ["lumberjack",["axe","chop","forest","log","timber","tree","wood"]],
  ["mason",["brick","build","chisel","hammer","mortar","stone","temple","wall"]],
  ["merchant",["bazaar","coin","gold","market","silk","spice","trade","travel"]],
  ["miner",["coal","dark","deep","dig","earth","gem","gold","iron","mine","ore","rock","tunnel"]],
  ["monk",["bell","candle","cloister","meditate","monastery","peace","pray","sacred","silence"]],
  ["navigator",["compass","map","north","sail","sea","ship","star","voyage"]],
  ["philosopher",["book","mind","question","think","truth","wisdom","word"]],
  ["poet",["ink","love","moon","muse","pen","poem","quill","rhyme","verse","write"]],
  ["potter",["clay","craft","earth","fire","kiln","shape","spin","vase","wheel"]],
  ["priest",["bell","candle","church","holy","pray","sacred","temple"]],
  ["ranger",["arrow","bow","forest","guard","hunt","trail","watch","wild"]],
  ["samurai",["blade","honor","katana","martial","sword","warrior"]],
  ["scholar",["book","ink","knowledge","learn","library","pen","read","scroll","wisdom","write"]],
  ["sculptor",["art","carve","chisel","marble","shape","stone","tool"]],
  ["shepherd",["flock","guard","lamb","meadow","sheep","staff","watch","wool"]],
  ["smith",["anvil","blacksmith","fire","forge","hammer","iron","metal","steel","sword","tool"]],
  ["spy",["disguise","hide","message","secret","shadow","silent","watch"]],
  ["weaver",["cloth","loom","pattern","silk","thread","wool"]],
  ["wizard",["magic","potion","spell","staff","star","tower","wand"]],
],

// ═══════════════════════════════════════════
//  WEATHER (expand from 12 → ~30)
// ═══════════════════════════════════════════
weather: [
  ["blizzard",["cold","ice","snow","storm","white","wind","winter"]],
  ["breeze",["calm","cool","fan","gentle","kite","leaf","sail","soft","wind"]],
  ["cyclone",["destroy","ocean","rain","spin","storm","tropical","wind"]],
  ["downpour",["cloud","flood","heavy","rain","storm","umbrella","water","wet"]],
  ["drought",["crack","desert","dry","earth","heat","sun","thirst","water"]],
  ["gale",["blow","ocean","sail","sea","ship","storm","strong","wave","wind"]],
  ["gust",["blow","breeze","flag","kite","leaf","sudden","wind"]],
  ["hail",["cold","ice","rain","storm","white","winter"]],
  ["heat",["burn","desert","fire","hot","melt","summer","sun","warm"]],
  ["hurricane",["destroy","flood","ocean","rain","storm","tropical","water","wind"]],
  ["monsoon",["flood","heavy","India","rain","season","storm","tropical","water","wind"]],
  ["overcast",["cloud","dark","dull","gray","rain","shadow","sky"]],
  ["rainbow",["arc","cloud","color","gold","light","rain","sky","spectrum","sun","water"]],
  ["sleet",["cold","ice","rain","snow","wet","winter"]],
  ["squall",["burst","ocean","rain","sail","storm","sudden","wave","wind"]],
  ["tempest",["fury","ocean","rage","rain","roar","ship","storm","wave","wind"]],
  ["tornado",["destroy","dust","funnel","spin","storm","wind"]],
  ["typhoon",["cyclone","destroy","flood","ocean","rain","storm","tropical","water","wind"]],
],

// ═══════════════════════════════════════════
//  MYTHOLOGY (expand from 7 → ~25)
// ═══════════════════════════════════════════
mythology: [
  ["centaur",["arrow","bow","forest","half","horse","hunt","star","wild"]],
  ["chimera",["beast","fire","fly","lion","monster","snake","wing"]],
  ["cyclops",["cave","eye","forge","giant","hammer","one","stone"]],
  ["demon",["dark","evil","fire","hell","horn","monster","red","shadow","soul"]],
  ["dwarf",["axe","cave","dig","earth","forge","gold","hammer","mine","mountain","short","stone"]],
  ["elf",["arrow","bow","ear","forest","green","magic","old","tree"]],
  ["fairy",["dance","enchant","fly","forest","glow","green","magic","small","star","wing"]],
  ["gargoyle",["guard","rain","roof","stone","tower","ugly","wall","watch"]],
  ["giant",["big","castle","cloud","fall","mountain","stone","strong","tall","tower"]],
  ["goblin",["cave","dark","gold","green","mine","mischief","night","small"]],
  ["griffin",["beak","claw","eagle","fly","gold","guard","lion","treasure","wing"]],
  ["hydra",["head","many","monster","poison","snake","swamp","water"]],
  ["kraken",["deep","giant","monster","ocean","sea","ship","squid","tentacle","water"]],
  ["leprechaun",["clover","gold","green","Ireland","luck","rainbow","small"]],
  ["mermaid",["beauty","fish","ocean","sea","sing","song","swim","tail","water"]],
  ["minotaur",["bull","horn","labyrinth","maze","monster","strong"]],
  ["oracle",["fate","future","god","mystery","predict","prophecy","temple","truth","vision"]],
  ["pegasus",["fly","hero","horse","sky","star","white","wing"]],
  ["siren",["danger","enchant","lure","ocean","rock","sea","ship","sing","song","voice"]],
  ["sphinx",["desert","Egypt","lion","mystery","puzzle","riddle","sand","stone","wing"]],
  ["titan",["ancient","big","giant","god","mighty","mountain","power","strong"]],
  ["troll",["bridge","cave","dark","giant","mountain","stone","ugly"]],
  ["unicorn",["forest","horse","horn","magic","pure","rainbow","silver","white"]],
  ["vampire",["bat","bite","blood","dark","fang","garlic","moon","night","shadow"]],
  ["witch",["broom","cauldron","cat","dark","fly","magic","moon","night","potion","spell"]],
  ["yeti",["cold","foot","ice","mountain","snow","white","wild"]],
],

// ═══════════════════════════════════════════
//  MUSIC (expand from 14 → ~30)
// ═══════════════════════════════════════════
music: [
  ["anthem",["nation","pride","sing","song","voice"]],
  ["banjo",["country","folk","string","tune"]],
  ["bass",["deep","drum","fish","low","music","rhythm","string","vibration"]],
  ["beat",["drum","heart","music","pulse","rhythm","tempo"]],
  ["cello",["bow","deep","melody","orchestra","string","wood"]],
  ["chord",["guitar","harmony","music","note","piano","string","tune"]],
  ["duet",["dance","harmony","love","pair","sing","song","two","voice"]],
  ["fiddle",["bow","dance","folk","melody","string","tune","violin"]],
  ["harmony",["balance","beauty","chord","melody","music","peace","sing","voice"]],
  ["hymn",["angel","bell","choir","church","god","holy","pray","sacred","sing","song","voice"]],
  ["lullaby",["baby","calm","gentle","moon","night","sing","sleep","soft","song"]],
  ["lute",["bard","medieval","melody","string","troubadour","tune"]],
  ["note",["melody","music","paper","pen","piano","sing","song","write"]],
  ["orchestra",["cello","conductor","drum","flute","harmony","melody","music","symphony","violin"]],
  ["overture",["beginning","melody","music","opera","orchestra","symphony"]],
  ["serenade",["guitar","love","moon","night","romance","sing","song","voice"]],
  ["solo",["alone","guitar","melody","music","one","piano","sing","violin","voice"]],
  ["sonata",["melody","music","piano","rhythm","symphony"]],
  ["soprano",["angel","high","opera","sing","voice"]],
  ["symphony",["harmony","melody","music","orchestra","rhythm"]],
  ["tempo",["beat","dance","fast","music","rhythm","slow","speed"]],
  ["timpani",["beat","boom","drum","loud","orchestra","thunder"]],
  ["treble",["high","melody","music","note","soprano"]],
  ["tune",["guitar","harmony","hum","melody","music","sing","song","whistle"]],
  ["viola",["bow","melody","orchestra","string","violin"]],
  ["violin",["bow","melody","music","orchestra","solo","string","tune"]],
],

// ═══════════════════════════════════════════
//  MATERIALS (expand from 16 → ~30)
// ═══════════════════════════════════════════
materials: [
  ["bamboo",["basket","build","forest","green","grow","panda","strong","wood"]],
  ["burlap",["bag","brown","coarse","fabric","rough","sack"]],
  ["canvas",["art","cloth","paint","picture","sail","tent"]],
  ["cashmere",["goat","luxury","scarf","soft","warm","wool"]],
  ["cement",["build","gray","hard","mix","stone","strong","wall"]],
  ["denim",["blue","cloth","cotton","fabric","jean","tough"]],
  ["enamel",["color","glaze","hard","paint","shine","smooth","teeth"]],
  ["felt",["cloth","craft","hat","soft","thick","wool"]],
  ["hemp",["cloth","fiber","green","rope","strong","weave"]],
  ["lace",["bride","cloth","delicate","elegant","flower","pattern","silk","thin","white"]],
  ["lacquer",["coat","gloss","shine","smooth","wood"]],
  ["linen",["bed","cloth","cool","fabric","light","sheet","summer","thin","white"]],
  ["parchment",["ancient","ink","letter","old","paper","scroll","write","yellow"]],
  ["plaster",["build","cast","mold","smooth","wall","white"]],
  ["porcelain",["china","cup","delicate","smooth","tea","thin","vase","white"]],
  ["satin",["cloth","dress","elegant","luxury","shine","silk","smooth","soft"]],
  ["suede",["boot","brown","leather","shoe","smooth","soft","touch"]],
  ["tarp",["canvas","cover","protect","rain","shelter","tent","waterproof"]],
  ["tweed",["brown","cloth","coat","country","fabric","rough","warm","wool"]],
  ["velvet",["burgundy","cloth","dark","dress","elegant","luxury","red","rich","smooth","soft"]],
  ["wicker",["basket","chair","craft","light","weave"]],
],

// ═══════════════════════════════════════════
//  CELESTIAL (expand from 24 → ~45)
// ═══════════════════════════════════════════
celestial: [
  ["asteroid",["crash","orbit","rock","sky","space","star"]],
  ["celestial",["angel","cloud","divine","heaven","sky","star"]],
  ["constellation",["bear","lion","map","myth","night","pattern","sky","star"]],
  ["cosmos",["dark","galaxy","infinite","space","star","universe","vast","void"]],
  ["crescent",["curve","horn","moon","night","silver","sky"]],
  ["dusk",["evening","fade","gold","horizon","orange","sky","sun","twilight"]],
  ["equinox",["balance","day","night","season","spring","sun"]],
  ["galaxy",["cosmos","dark","infinite","light","nebula","space","spiral","star","vast"]],
  ["halo",["angel","glow","gold","light","moon","ring","saint","sun"]],
  ["horizon",["dawn","distant","dusk","earth","far","line","ocean","sky","sun"]],
  ["lunar",["cold","crater","moon","night","silver","tide"]],
  ["midnight",["clock","cold","dark","hour","moon","night","shadow","silence","star","twelve"]],
  ["milkyway",["galaxy","glow","light","night","sky","star"]],
  ["nova",["bright","burst","explosion","light","new","sky","star"]],
  ["orbit",["circle","moon","planet","ring","satellite","space","spin","sun"]],
  ["planet",["earth","gas","Jupiter","Mars","orbit","ring","satellite","space","star","sun"]],
  ["pulsar",["beam","distant","light","radio","spin","star"]],
  ["satellite",["orbit","planet","signal","sky","space","spin"]],
  ["solstice",["festival","long","season","summer","sun","winter"]],
  ["starlight",["beam","dark","distant","glow","moon","night","shine","sky","star"]],
  ["supernova",["blast","bright","explosion","light","nova","sky","star"]],
  ["twilight",["dusk","evening","fade","gold","horizon","light","moon","purple","sky","star","sun"]],
  ["universe",["cosmos","dark","galaxy","infinite","space","star","vast","void"]],
  ["zenith",["apex","high","noon","peak","sky","star","summit","sun","top"]],
],

// ═══════════════════════════════════════════
//  WARFARE (expand from 6 → ~20)
// ═══════════════════════════════════════════
warfare: [
  ["ambush",["attack","forest","hide","surprise","trap","war"]],
  ["barricade",["block","defend","door","fence","shield","wall","war"]],
  ["catapult",["castle","fling","launch","siege","stone","war","weapon"]],
  ["cavalry",["charge","fast","horse","knight","ride","sword","war"]],
  ["fortress",["castle","defend","gate","guard","king","stone","tower","wall","war"]],
  ["garrison",["castle","defend","guard","soldier","wall","war"]],
  ["lance",["charge","horse","joust","knight","long","sharp","spear","war"]],
  ["legion",["army","march","many","Rome","soldier","strong","war"]],
  ["moat",["castle","deep","defend","dragon","guard","wall","water"]],
  ["rampart",["castle","defend","guard","stone","tower","wall","war"]],
  ["siege",["castle","catapult","long","surround","tower","wall","war"]],
  ["spear",["bronze","hunt","lance","long","point","sharp","throw","war","weapon"]],
  ["trench",["deep","defend","dig","earth","mud","shelter","soldier","war"]],
  ["weapon",["arrow","blade","bow","gun","knife","shield","spear","sword","war"]],
],

};

// ═══════════════════════════════════════════
//  MERGE INTO DATA-CORE.JS
// ═══════════════════════════════════════════
const src = fs.readFileSync('data-core.js', 'utf8');

// Extract existing concepts
const conceptsMatch = src.match(/concepts:\s*\{/);
const startIdx = src.indexOf('{', conceptsMatch.index);
let depth = 0, endIdx = -1;
for (let i = startIdx; i < src.length; i++) {
  if (src[i] === '{') depth++;
  if (src[i] === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
}
const conceptsStr = src.substring(startIdx, endIdx + 1);
eval('var concepts = ' + conceptsStr);

// Add new concepts
let added = 0, skipped = 0, connAdded = 0;
for (const [group, entries] of Object.entries(NEW_CONCEPTS)) {
  for (const [word, conns] of entries) {
    if (concepts[word]) {
      // Word exists — add missing connections
      for (const c of conns) {
        if (!concepts[word].c.includes(c)) {
          concepts[word].c.push(c);
          connAdded++;
        }
      }
      skipped++;
    } else {
      concepts[word] = { c: conns.slice(), g: group };
      added++;
    }
  }
}

// Make all connections bidirectional
let biFixed = 0;
for (const [word, data] of Object.entries(concepts)) {
  for (const conn of data.c) {
    if (concepts[conn] && !concepts[conn].c.includes(word)) {
      concepts[conn].c.push(word);
      biFixed++;
    }
  }
}

// Remove dangling references
let danglingRemoved = 0;
for (const [word, data] of Object.entries(concepts)) {
  const before = data.c.length;
  data.c = data.c.filter(c => concepts[c]);
  danglingRemoved += before - data.c.length;
}

// Sort all connections
for (const data of Object.values(concepts)) {
  data.c.sort();
  data.c = [...new Set(data.c)]; // dedupe
}

// Rebuild
const lines = [];
const sortedWords = Object.keys(concepts).sort();
for (const w of sortedWords) {
  const d = concepts[w];
  const conns = d.c.map(c => `"${c}"`).join(',');
  lines.push(`    "${w}": { c: [${conns}], g: "${d.g}" }`);
}
const newConceptsStr = '{\n' + lines.join(',\n') + '\n  }';
const newSrc = src.substring(0, startIdx) + newConceptsStr + src.substring(endIdx + 1);
fs.writeFileSync('data-core.js', newSrc);

// Verify
let totalConns = 0, unidir = 0, dangling = 0;
const groups = {};
for (const [w, data] of Object.entries(concepts)) {
  groups[data.g] = (groups[data.g] || 0) + 1;
  for (const conn of data.c) {
    totalConns++;
    if (!concepts[conn]) dangling++;
    else if (!concepts[conn].c.includes(w)) unidir++;
  }
}

console.log('=== EXPANSION RESULTS ===');
console.log('New concepts added:', added);
console.log('Existing concepts enhanced:', skipped);
console.log('New connections to existing:', connAdded);
console.log('Bidirectional fixes:', biFixed);
console.log('Dangling refs removed:', danglingRemoved);
console.log('');
console.log('=== FINAL GRAPH STATS ===');
console.log('Total concepts:', sortedWords.length);
console.log('Total connections:', totalConns);
console.log('Avg connections/word:', (totalConns / sortedWords.length).toFixed(1));
console.log('Unidirectional:', unidir);
console.log('Dangling:', dangling);
console.log('');
console.log('Groups:', JSON.stringify(groups, null, 2));

// Connectivity check via BFS
const visited = new Set();
const queue = [sortedWords[0]];
visited.add(sortedWords[0]);
while (queue.length) {
  const node = queue.shift();
  for (const conn of concepts[node].c) {
    if (!visited.has(conn)) {
      visited.add(conn);
      queue.push(conn);
    }
  }
}
console.log('\nConnectivity: ' + visited.size + '/' + sortedWords.length + ' reachable');
if (visited.size < sortedWords.length) {
  const unreachable = sortedWords.filter(w => !visited.has(w));
  console.log('Unreachable:', unreachable.slice(0, 20).join(', '));
}
