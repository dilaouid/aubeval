// PROTOTYPE - NOT FOR PRODUCTION
// ES layer of data/people.js (js/i18n.js). One text per path, the French beside it.
// null: still to translate. Written by node tools/i18n.js extract es; translations already here are kept.
I18N.add('es', {
  'classes[peasant].name': 'Campesinos', // Paysans
  'classes[peasant].one': 'Campesino', // Paysan
  'classes[peasant].desc': 'Piden pan. Bien alimentados, pagan el impuesto entero y pueden ascender.', // Ils demandent du pain. Bien nourris, ils paient plein impôt et peuvent s’élever.
  'classes[artisan].name': 'Artesanos', // Artisans
  'classes[artisan].one': 'Artesano', // Artisan
  'classes[artisan].desc': 'Pan y café, y un Café al final de la calle. Abren la Capilla y el Mercado, y forman a los arqueros.', // Pain et café, et un Café au bout de la rue. Ils ouvrent la Chapelle et le Marché, et forment les archers.
  'classes[burgher].name': 'Burgueses', // Bourgeois
  'classes[burgher].one': 'Burgués', // Bourgeois
  'classes[burgher].desc': 'Pan, café y especias del Mercado, un Café y una Capilla a mano. Necesitan un Burgo. Abren la lana y el tejido, y arman a los caballeros.', // Pain, café et épices du Marché, un Café et une Chapelle à portée. Il leur faut un Bourg. Ils ouvrent la laine et le tissage, et arment les chevaliers.
  'classes[merchant].name': 'Comerciantes', // Négociants
  'classes[merchant].one': 'Comerciante', // Négociant
  'classes[merchant].desc': 'Suman las telas, quieren el Mercado a mano y una calle agradable (belleza 4). Necesitan una Villa. Abren el Orfebre.', // Ajoutent les étoffes, veulent le Marché à portée et une rue plaisante (beauté 4). Il leur faut une Ville. Ils ouvrent l’Orfèvre.
  'classes[noble].name': 'Nobles', // Nobles
  'classes[noble].one': 'Noble', // Noble
  'classes[noble].desc': 'Además, joyas y una calle soberbia (belleza 10): fuentes, estatuas, árboles y flores. Necesitan una Ciudad y {g:un héroe querido|una heroína querida} por su pueblo.', // Bijoux en plus, et une rue superbe (beauté 10) : fontaines, statues, arbres et fleurs. Il leur faut une Cité, et {g:un héros aimé|une héroïne aimée} de sa ville.
  'units.woodcutter.name': 'Leñador', // Bûcheron
  'units.woodcutter.plural': 'Leñadores', // Bûcherons
  'units.woodcutter.desc': 'Corta madera del árbol más cercano y la trae. Una cabaña del leñador junto al bosque acorta sus viajes.', // Coupe du bois à l’arbre le plus proche et le rapporte. Une cabane de bûcheron près de la forêt raccourcit ses trajets.
  'units.miner.name': 'Minero', // Mineur
  'units.miner.plural': 'Mineros', // Mineurs
  'units.miner.desc': 'Labra la roca más cercana y trae la piedra. Una cantera le sirve de depósito.', // Taille le rocher le plus proche et rapporte la pierre. Une carrière sert de dépôt.
  'units.farmhand.name': 'Segador', // Moissonneur
  'units.farmhand.plural': 'Segadores', // Moissonneurs
  'units.farmhand.desc': 'Siega los campos de una granja y lleva el trigo a la aldea.', // Fauche aux champs d’une ferme et porte le blé au village.
  'units.militia.name': 'Miliciano', // Milicien
  'units.militia.plural': 'Milicianos', // Miliciens
  'units.militia.desc': 'Lanza y escudo: corta el paso, y los saqueadores deben detenerse a combatirlo.', // Lance et bouclier : il barre la route, les pillards doivent s’arrêter pour le combattre.
  'units.archer.name': 'Arquero', // Archer
  'units.archer.plural': 'Arqueros', // Archers
  'units.archer.desc': 'Dispara de lejos, por encima de las murallas. Frágil: manténgalo tras sus milicianos.', // Tire de loin, par-dessus les remparts. Fragile : gardez-le derrière vos miliciens.
  'units.knight.name': 'Caballero', // Chevalier
  'units.knight.plural': 'Caballeros', // Chevaliers
  'units.knight.desc': 'Arnés de acero: defiende solo una brecha y parte a los brutos.', // Harnois d’acier : il tient seul une brèche et fend les brutes.
  'traps.spikes.name': 'Estacas', // Pieux
  'traps.spikes.card': 'Estacas', // Pieux
  'traps.spikes.desc': 'Hiere a cada saqueador que las pisa. Aguanta seis pasadas.', // Blesse chaque pillard qui marche dessus. Tient six passages.
  'traps.tar.name': 'Charco de brea', // Mare de poix
  'traps.tar.card': 'Brea', // Poix
  'traps.tar.desc': 'Atrapa a los saqueadores: se arrastran tres segundos bajo el tiro de sus torres.', // Englue les pillards : ils rampent trois secondes sous le tir de vos tours.
  'traps.powder.name': 'Barril de pólvora', // Baril de poudre
  'traps.powder.card': 'Pólvora', // Poudre
  'traps.powder.desc': 'Estalla con el primer saqueador y barre a todo el grupo, armaduras incluidas.', // Explose au premier pillard et souffle tout le groupe, armures comprises.
  'keepers.steward.name': 'Maese Odon', // Maître Odon
  'keepers.steward.title': 'Intendente', // Intendant
  'keepers.steward.lines[0]': 'Los registros están al día, señor. Casi.', // Les registres sont à jour, messire. Presque.
  'keepers.steward.lines[1]': 'Una aldea se cuenta en bocas que alimentar.', // Un village se compte en bouches à nourrir.
  'keepers.steward.lines[2]': 'Campesinos saciados hacen buenos artesanos.', // Des paysans repus font de bons artisans.
  'keepers.steward.raid': '¡A cubierto! Yo guardo los registros, usted guarde lo demás.', // Aux abris ! Je garde les registres, gardez le reste.
  'keepers.smith.name': 'Bram', // Bram
  'keepers.smith.title': 'Herrero', // Forgeron
  'keepers.smith.lines[0]': 'Buena madera, buen hierro, y le hago una leyenda.', // Du bon bois, du bon fer, et je vous fais une légende.
  'keepers.smith.lines[1]': 'A una hoja se la respeta. Y se la refuerza.', // Une lame, ça se respecte. Et ça se renforce.
  'keepers.smith.lines[2]': '{g:El héroe|La heroína} rompe, yo arreglo.', // {g:Le héros|L’héroïne} casse, moi je répare.
  'keepers.smith.busy': '¡Atrás, que quema! Estará lista pronto.', // Reculez, ça chauffe ! Elle sera prête bientôt.
  'keepers.baker.name': 'Mélisande', // Mélisande
  'keepers.baker.title': 'Panadera', // Boulangère
  'keepers.baker.lines[0]': 'Una hogaza caliente y el mundo va mejor.', // Une miche chaude et le monde va mieux.
  'keepers.baker.lines[1]': 'Sus campesinos comen por cuatro. ¡Mejor así!', // Vos paysans mangent comme quatre. Tant mieux !
  'keepers.baker.lines[2]': 'Lleve un poco para {g:el héroe|la heroína}, tiene mala cara.', // Emportez-en pour {g:le héros|l’héroïne}, {g:il|elle} a mauvaise mine.
  'keepers.baker.sad': 'Ni un grano de trigo… no puedo amasar el viento.', // Plus un grain de blé… je ne peux pas pétrir du vent.
  'keepers.innkeeper.name': 'Gaspard', // Gaspard
  'keepers.innkeeper.title': 'Cafetero', // Cafetier
  'keepers.innkeeper.lines[0]': 'Una taza negra y bien cargada, y empieza el día.', // Une tasse noire et serrée, et la journée commence.
  'keepers.innkeeper.lines[1]': 'Un artesano sin café es un campesino que bosteza.', // Un artisan sans café, c’est un paysan qui bâille.
  'keepers.innkeeper.lines[2]': 'Aquí arreglamos el mundo. Y la aldea, a veces.', // Ici, on refait le monde. Et le village, parfois.
  'keepers.innkeeper.lines[3]': 'Las casas al alcance de mi mostrador crecen más deprisa.', // Les maisons à portée de mon comptoir s’élèvent plus vite.
  'keepers.innkeeper.sad': 'Ni un grano de café… ahora sirvo agua caliente.', // Plus un grain de café… je sers de l’eau chaude, maintenant.
  'keepers.merchant.name': 'Dama Ysolde', // Dame Ysolde
  'keepers.merchant.title': 'Comerciante', // Marchande
  'keepers.merchant.lines[0]': 'Todo se compra, amigo mío. Sobre todo lo que falta.', // Tout s’achète, mon ami. Surtout ce qui manque.
  'keepers.merchant.lines[1]': 'Mis especias vienen de más allá de sus mapas.', // Mes épices viennent de plus loin que vos cartes.
  'keepers.merchant.lines[2]': 'Vendo caro y compro barato: es un oficio.', // Je vends cher, j’achète bas : c’est un métier.
  'keepers.merchant.raid': '¡Cierro la tienda hasta que esto se calme!', // Je ferme boutique le temps que ça se calme !
  'keepers.captain.name': 'Capitana Hilde', // Capitaine Hilde
  'keepers.captain.title': 'Capitana de la guardia', // Capitaine de la garde
  'keepers.captain.lines[0]': 'Deme diez milicianos y defiendo la puerta.', // Donnez-moi dix miliciens et je tiens la porte.
  'keepers.captain.lines[1]': 'Un arquero tras un muro vale por tres lanzas.', // Un archer derrière un mur vaut trois lances.
  'keepers.captain.lines[2]': 'Seleccione a mis soldados, señale, y allá van.', // Sélectionnez mes soldats, pointez, et ils y vont.
  'keepers.captain.busy': '¡Un-dos, un-dos! El recluta estará listo en breve.', // Un-deux, un-deux ! La recrue sera prête sous peu.
  'keepers.captain.raid': '¡A sus puestos! ¡Clic derecho donde los quiera!', // À vos postes ! Clic droit là où vous les voulez !
});
