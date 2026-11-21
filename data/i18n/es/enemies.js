// PROTOTYPE - NOT FOR PRODUCTION
// ES layer of data/enemies.js (js/i18n.js). One text per path, the French beside it.
// null: still to translate. Written by node tools/i18n.js extract es; translations already here are kept.
I18N.add('es', {
  'enemies.gobelin.name': 'Goblin ladronzuelo', // Gobelin chapardeur
  'enemies.gobelin.how': 'Rápido: dos golpecitos por turno, así que dos paradas.', // Rapide : deux petits coups par tour, donc deux parades.
  'enemies.brute.name': 'Bruto acorazado', // Brute cuirassée
  'enemies.brute.how': 'Lento y blindado. Alza su maza y golpea terriblemente al turno siguiente: Guardia, parada, o hágale perder el turno.', // Lente et blindée. Lève sa massue, puis frappe terriblement au tour suivant : Garde, parade, ou faites-lui perdre son tour.
  'enemies.chaman.name': 'Chamán de las Zarzas', // Chaman des Ronces
  'enemies.chaman.how': 'Cura a sus aliados; su maleficio atraviesa la armadura y la Guardia: solo la parada lo detiene. Abátalo primero.', // Soigne ses alliés ; son maléfice traverse l’armure et la Garde : seule la parade l’arrête. À abattre en premier.
  'enemies.grakk.name': 'Grakk el Hendedor', // Grakk le Fendeur
  'enemies.grakk.how': 'Caudillo. Su hendedor cae un turno después de alzarlo; herido, llama a un goblin y luego se enfurece.', // Chef de guerre. Son fendoir tombe un tour après avoir été levé ; blessé, il appelle un gobelin, puis enrage.
  'enemies.warlord.name': 'Caudillo', // Chef de guerre
  'enemies.morgash.name': 'Morgash el Rompemuros', // Morgash le Briseur de murs
  'enemies.morgash.how': 'Su martillo quiebra la Guardia antes de golpear: solo la parada detiene ese golpe. Luego lo alza para un golpe terrible.', // Son marteau fracasse la Garde avant de frapper : seule la parade arrête ce coup-là. Puis il le lève pour un coup terrible.
  'enemies.zhara.name': 'Zhara la Madre Zarza', // Zhara la Ronce-mère
  'enemies.zhara.how': 'Sus maleficios atraviesan la Guardia y la armadura. Herida, se cura y llama a un chamán: golpee fuerte, sin tregua.', // Ses maléfices traversent la Garde et l’armure. Blessée, elle se soigne et appelle un chaman : frappez fort, sans relâche.
  'enemies.urgak.name': 'Urgak el Arriero de brutos', // Urgak le Meneur de brutes
  'enemies.urgak.how': 'Alza su hendedor y luego lo descarga. Herido, llama a un bruto con un silbido y luego se enfurece.', // Lève son fendoir, puis l’abat. Blessé, il siffle une brute, puis enrage.
  'enemies.skrit.name': 'Skrit la Hoja Viva', // Skrit la Lame vive
  'enemies.skrit.how': 'Dos golpes, luego tres, sin respiro: otras tantas paradas. Poca armadura: cada contraataque cuenta.', // Deux coups, puis trois, sans répit : autant de parades. Peu d’armure : chaque riposte compte.
  'warlords[morgash].name': 'Morgash', // Morgash
  'warlords[morgash].title': 'el Rompemuros', // le Briseur de murs
  'warlords[morgash].trait': 'Sus saqueadores derriban murallas y edificios el doble de rápido.', // Ses pillards abattent remparts et bâtiments deux fois plus vite.
  'warlords[morgash].how': 'Su martillo quiebra la Guardia antes de golpear: solo la parada detiene ese golpe. Luego lo alza para un golpe terrible.', // Son marteau fracasse la Garde avant de frapper : seule la parade arrête ce coup-là. Puis il le lève pour un coup terrible.
  'warlords[morgash].short': 'Sus saqueadores rompen muros 2× más rápido.', // Ses pillards brisent les murs 2× plus vite.
  'warlords[zhara].name': 'Zhara', // Zhara
  'warlords[zhara].title': 'la Madre Zarza', // la Ronce-mère
  'warlords[zhara].trait': 'Dos chamanes más en su columna, y sus curas se duplican.', // Deux chamans de plus dans sa colonne, et leurs soins sont doublés.
  'warlords[zhara].how': 'Sus maleficios atraviesan la Guardia y la armadura. Herida, se cura y llama a un chamán: golpee fuerte, sin tregua.', // Ses maléfices traversent la Garde et l’armure. Blessée, elle se soigne et appelle un chaman : frappez fort, sans relâche.
  'warlords[zhara].short': 'Dos chamanes más, con curas dobles.', // Deux chamans de plus, aux soins doublés.
  'warlords[urgak].name': 'Urgak', // Urgak
  'warlords[urgak].title': 'el Arriero de brutos', // le Meneur de brutes
  'warlords[urgak].trait': 'Tres brutos acorazados más marchan delante de él.', // Trois brutes cuirassées de plus marchent devant lui.
  'warlords[urgak].how': 'Alza su hendedor y luego lo descarga. Herido, llama a un bruto con un silbido y luego se enfurece.', // Lève son fendoir, puis l’abat. Blessé, il siffle une brute, puis enrage.
  'warlords[urgak].short': 'Tres brutos más en cabeza de columna.', // Trois brutes de plus en tête de colonne.
  'warlords[skrit].name': 'Skrit', // Skrit
  'warlords[skrit].title': 'la Hoja Viva', // la Lame vive
  'warlords[skrit].trait': 'Su columna corre: todos sus saqueadores van un cuarto más rápido.', // Sa colonne court : tous ses pillards vont un quart plus vite.
  'warlords[skrit].how': 'Dos golpes, luego tres, sin respiro: otras tantas paradas. Poca armadura: cada contraataque cuenta.', // Deux coups, puis trois, sans répit : autant de parades. Peu d’armure : chaque riposte compte.
  'warlords[skrit].short': 'Toda su columna va un cuarto más rápido.', // Toute sa colonne va un quart plus vite.
  'elites[fire].name': 'Incendiarios', // Incendiaires
  'elites[fire].short': 'Queman los talleres que rozan.', // Ils brûlent les ateliers qu’ils frôlent.
  'elites[fire].trait': 'Cada saqueador incendia el primer edificio de producción junto al que pasa. Manténgalos lejos de los talleres: murallas, torres y soldados al frente.', // Chaque pillard met le feu au premier bâtiment de production qu’il longe. Tenez-les loin des ateliers : remparts, tours, soldats en avant.
  'elites[armor].name': 'Blindados', // Blindés
  'elites[armor].short': 'Armadura +2: hay que perforarla.', // Armure +2 : il faut percer.
  'elites[armor].trait': 'Cada saqueador lleva 2 puntos más de armadura: las flechas de las atalayas resbalan. Torres del mago, trampas y soldados marcan la diferencia.', // Chaque pillard porte 2 points d’armure de plus : les flèches des tours de guet glissent. Tours de mage, pièges et soldats font la différence.
  'elites[swift].name': 'Corredores', // Coureurs
  'elites[swift].short': 'Más rápidos, en filas cerradas.', // Plus rapides, en rangs serrés.
  'elites[swift].trait': 'La columna corre un tercio más rápido y sale del campamento en filas cerradas: las torres tienen menos tiempo para disparar.', // La colonne court un tiers plus vite et sort du camp en rangs serrés : les tours ont moins de temps pour tirer.
  'elites[horde].name': 'Horda', // Horde
  'elites[horde].short': 'Un 50 % más de saqueadores.', // Moitié plus nombreux.
  'elites[horde].trait': 'Una columna con un 50 % más de saqueadores de lo habitual.', // Une colonne moitié plus nombreuse que d’habitude.
  'elites[flank].name': 'Dos frentes', // Deux fronts
  'elites[flank].short': 'Dos columnas, dos flancos.', // Deux colonnes, deux côtés.
  'elites[flank].trait': 'La mitad de los saqueadores toma otro camino y llega por otro lado de la aldea.', // La moitié des pillards prend un autre chemin et arrive par un autre côté du village.
  'royal.lord.name': 'Grakk', // Grakk
  'royal.lord.title': 'el Hendedor', // le Fendeur
  'royal.lord.trait': 'Encabeza la última oleada del Asedio real: dos brutos y un chamán más marchan con él, y toda su columna es un quinto más resistente.', // Il mène la dernière vague du Siège royal : deux brutes et un chaman de plus marchent avec lui, et toute sa colonne est un cinquième plus solide.
  'royal.lord.short': 'Dos brutos y un chamán más, más resistentes.', // Deux brutes, un chaman de plus, plus solides.
  'camp.chiefs[0]': 'Brok el Tuerto', // Brok le Borgne
  'camp.chiefs[1]': 'Varka Dientedehierro', // Varka Dent-de-fer
  'camp.chiefs[2]': 'Ghuz el Gordo', // Ghuz le Gras
  'camp.chiefs[3]': 'Nazra la Cenizosa', // Nazra la Cendrée
  'camp.chiefs[4]': 'Oth el Sordo', // Oth le Sourd
  'camp.chiefs[5]': 'Rikka Sin Oreja', // Rikka Sans-oreille
});
