// PROTOTYPE - NOT FOR PRODUCTION
// ES layer of data/venues.js (js/i18n.js). One text per path, the French beside it.
// null: still to translate. Written by node tools/i18n.js extract es; translations already here are kept.
I18N.add('es', {
  'venueBuffs.pop.name': 'La ronda de Gaspard', // La tournée de Gaspard
  'venueBuffs.pop.text': 'Popularidad de los juegos +{n} %', // Popularité des jeux +{n} %
  'venueBuffs.pop.short': 'juegos +{n} %', // jeux +{n} %
  'venueBuffs.buy.name': 'Precio de amiga', // Prix d’amie
  'venueBuffs.buy.text': 'Compras en el mercado −{n} %', // Achats au marché −{n} %
  'venueBuffs.buy.short': 'compras −{n} %', // achats −{n} %
  'venueBuffs.sell.name': 'Precio de amiga', // Prix d’amie
  'venueBuffs.sell.text': 'Ventas en el mercado +{n} %', // Ventes au marché +{n} %
  'venueBuffs.sell.short': 'ventas +{n} %', // ventes +{n} %
  'venueBuffs.atk.name': 'Hoja bien batida', // Lame bien battue
  'venueBuffs.atk.text': 'Ataque {g:del héroe|de la heroína} +{n} %', // Attaque {g:du héros|de l’héroïne} +{n} %
  'venueBuffs.atk.short': 'ataque +{n} %', // attaque +{n} %
  'venueBuffs.forge.name': 'Fuego vivo', // Feu vif
  'venueBuffs.forge.text': 'Forja un {n} % más rápida', // Forge {n} % plus rapide
  'venueBuffs.forge.short': 'forja +{n} %', // forge +{n} %
  'venueBuffs.rise.name': 'Pan caliente', // Pain chaud
  'venueBuffs.rise.text': 'Satisfacción de las casas un {n} % más rápida', // Satisfaction des maisons {n} % plus rapide
  'venueBuffs.rise.short': 'satisfacción +{n} %', // satisfaction +{n} %
  'venueBuffs.soldier.name': 'Bien entrenados', // Bien drillés
  'venueBuffs.soldier.text': 'Los soldados golpean un {n} % más fuerte', // Les soldats frappent {n} % plus fort
  'venueBuffs.soldier.short': 'soldados +{n} %', // soldats +{n} %
  'venueBuffs.build.name': 'Planos de Aveline', // Plans d’Aveline
  'venueBuffs.build.text': 'Construcciones y mejoras {n} % más baratas', // Constructions et améliorations {n} % moins chères
  'venueBuffs.build.short': 'construir −{n} %', // bâtir −{n} %
  'venues.cafe.name': 'El Café de Aubeval', // Le Café d’Aubeval
  'venues.cafe.title': 'El ajetreo', // Le coup de feu
  'venues.cafe.unit': 'monedas de propina', // sous de pourboire
  'venues.cafe.how': 'Los clientes piden y luego su globo se cierra: sirva las tazas correctas, en orden, antes de que se agote su paciencia.', // Les clients commandent, puis leur bulle se referme : servez les bonnes tasses, dans l’ordre, avant que leur patience ne s’use.
  'venues.cafe.keys': 'Teclas 1 a 6, o clic en las tazas. Una taza errónea cuesta paciencia, pero el cliente repite.', // Touches 1 à 6, ou clic sur les tasses. Une tasse fausse coûte de la patience, mais le client répète.
  'venues.cafe.drinks[noir].name': 'Solo', // Noir
  'venues.cafe.drinks[creme].name': 'Con leche', // Crème
  'venues.cafe.drinks[noisette].name': 'Cortado', // Noisette
  'venues.cafe.drinks[chocolat].name': 'Chocolate', // Chocolat
  'venues.cafe.drinks[tisane].name': 'Infusión', // Tisane
  'venues.cafe.drinks[lait].name': 'Leche caliente', // Lait chaud
  'venues.cafe.thanks[0]': '¡Gracias!', // Merci !
  'venues.cafe.thanks[1]': 'Perfecto.', // Parfait.
  'venues.cafe.thanks[2]': '¡Ah, por fin!', // Ah, enfin !
  'venues.cafe.thanks[3]': 'Exquisito.', // Fameux.
  'venues.cafe.leaves[0]': '¡Qué lento!', // Trop long !
  'venues.cafe.leaves[1]': '¡Me voy!', // Je m’en vais !
  'venues.cafe.leaves[2]': 'Otra vez será.', // Tant pis.
  'venues.cafe.greet': '¡Pase, pase! Aquí se sirve caliente y se habla alto. Cuando la sala se llena, una mano tras el mostrador nunca sobra.', // Entrez, entrez ! Ici on sert chaud et on parle fort. Quand la salle se remplit, un coup de main derrière le comptoir ne se refuse pas.
  'venues.cafe.ready[0]': 'La sala se llena, {g:héroe|heroína}. ¿Pasa usted tras el mostrador?', // La salle se remplit, {g:héros|héroïne}. Vous passez derrière le comptoir ?
  'venues.cafe.ready[1]': 'Se avecina el ajetreo. Le espera un delantal.', // Ça va être le coup de feu. Un tablier vous attend.
  'venues.cafe.ready[2]': 'Las tazas están calientes, llegan los clientes. ¿Vamos?', // Les tasses sont chaudes, les clients arrivent. On y va ?
  'venues.cafe.wait[0]': 'Déjeme secar las tazas, volvemos a ello en un rato.', // Laissez-moi essuyer mes tasses, on remet ça tout à l’heure.
  'venues.cafe.wait[1]': 'La sala respira un poco. Vuelva dentro de un momento.', // La salle souffle un peu. Revenez dans un moment.
  'venues.cafe.chat[0]': 'Una taza negra y bien cargada, y empieza el día.', // Une tasse noire et serrée, et la journée commence.
  'venues.cafe.chat[1]': 'Un artesano sin café es un campesino que bosteza.', // Un artisan sans café, c’est un paysan qui bâille.
  'venues.cafe.chat[2]': 'Aquí arreglamos el mundo. Y la aldea, a veces.', // Ici, on refait le monde. Et le village, parfois.
  'venues.cafe.chat[3]': 'Cuando {g:el héroe|la heroína} sirve en el mostrador, toda la calle viene a {g:verlo|verla}. Bueno para usted, bueno para mí.', // Quand {g:le héros|l’héroïne} sert au comptoir, toute la rue vient voir. C’est bon pour vous, c’est bon pour moi.
  'venues.cafe.chat[4]': 'Maese Odon siempre toma un café con leche. Dice que es por los registros.', // Maître Odon prend toujours un crème. Il dit que c’est pour les registres.
  'venues.cafe.tips[0]': 'Se dice en el mostrador que', // On dit au comptoir que
  'venues.cafe.tips[1]': 'Entre taza y taza, oí que', // Entre deux tasses, j’ai entendu que
  'venues.cafe.tips[2]': 'Preste oído:', // Tendez l’oreille :
  'venues.cafe.glad[0]': '¡Uno servido!', // Et un de servi !
  'venues.cafe.glad[1]': '¡Bien hecho!', // Bien joué !
  'venues.cafe.glad[2]': '¡Esto marcha!', // Ça tourne !
  'venues.cafe.glad[3]': '¡Listo!', // Voilà !
  'venues.cafe.cross[0]': '¡Esa no!', // Pas celle-là !
  'venues.cafe.cross[1]': '¡Ay, el pedido!', // Aïe, la commande !
  'venues.cafe.cross[2]': '¡No, no!', // Non, non !
  'venues.cafe.lost[0]': 'Otro que se va…', // Encore un de parti…
  'venues.cafe.lost[1]': 'Volverá. Quizá.', // Il reviendra. Peut-être.
  'venues.cafe.after[0]': 'La sala se vació, y no para bien… Lo volveremos a intentar.', // La salle s’est vidée, et pas en bien… On réessaiera.
  'venues.cafe.after[1]': '¡Nada mal para {g:un héroe|una heroína}! Los clientes sonrieron.', // Pas mal pour {g:un héros|une héroïne} ! Les clients ont souri.
  'venues.cafe.after[2]': '¡Buen servicio! Toda la calle hablará de usted.', // Beau service ! On va parler de vous dans toute la rue.
  'venues.cafe.after[3]': '¡Un servicio de rey! Ronda para todos, y todo Aubeval sabrá quién la sirvió.', // Un service de roi ! Tournée générale, et tout Aubeval saura qui l’a servie.
  'venues.market.name': 'La Lonja del Mercado', // La Halle du Marché
  'venues.market.title': 'Regateo', // Marchandage
  'venues.market.unit': '% de rebaja', // % de rabais
  'venues.market.how': 'Detenga la aguja en la zona verde para bajar el precio. Tras cada ronda: apretar más o cerrar el trato. Apriete una vez de más y ella se marcha.', // Arrêtez l’aiguille dans la zone verte pour faire baisser le prix. Après chaque manche : pousser encore, ou toper. Poussez une fois de trop et elle s’en va.
  'venues.market.keys': 'Espacio o clic: detener la aguja. ↑: apretar más. Intro: cerrar el trato.', // Espace ou clic : arrêter l’aiguille. ↑ : pousser encore. Entrée : toper.
  'venues.market.lots[0].name': 'Un lote de especias de Levante', // Un lot d’épices du Levant
  'venues.market.lots[1].name': 'Diez rollos de tela fina', // Dix rouleaux d’étoffe fine
  'venues.market.lots[2].name': 'Tres sacos de café de las islas', // Trois sacs de café des îles
  'venues.market.lots[3].name': 'Un cofre de joyas', // Un coffret de bijoux
  'venues.market.lots[4].name': 'Veinte vellones de lana', // Vingt toisons de laine
  'venues.market.greet': 'Acérquese, burgomaestre. Aquí todo se compra y todo se discute. Pero sépalo: nunca pierdo dos veces contra el mismo cliente.', // Approchez, bourgmestre. Tout s’achète ici, et tout se discute. Mais sachez-le : je ne perds jamais deux fois contre le même client.
  'venues.market.ready[0]': 'Tengo un buen negocio sobre la mesa. ¿Se atreve a regatear?', // J’ai une belle affaire sur la table. Vous osez marchander ?
  'venues.market.ready[1]': 'Acaba de llegar un lote. Dígame su precio, que nos riamos un poco.', // Un lot vient d’arriver. Faites-moi votre prix, qu’on rie un peu.
  'venues.market.ready[2]': 'Veamos si cuenta tan bien como construye.', // Voyons si vous comptez aussi bien que vous bâtissez.
  'venues.market.wait[0]': 'No hay negocio por ahora, amigo mío. La próxima caravana llega pronto.', // Pas d’affaire pour l’instant, mon ami. La prochaine caravane arrive bientôt.
  'venues.market.wait[1]': 'Déjeme repasar mis cuentas. Vuelva dentro de un rato.', // Laissez-moi refaire mes comptes. Revenez tout à l’heure.
  'venues.market.chat[0]': 'Todo se compra, amigo mío. Sobre todo lo que falta.', // Tout s’achète, mon ami. Surtout ce qui manque.
  'venues.market.chat[1]': 'Mis especias vienen de más allá de sus mapas.', // Mes épices viennent de plus loin que vos cartes.
  'venues.market.chat[2]': 'Vendo caro y compro barato: es un oficio.', // Je vends cher, j’achète bas : c’est un métier.
  'venues.market.chat[3]': '{g:Un héroe querido|Una heroína querida} paga menos. Los comerciantes también leen caras.', // {g:Un héros|Une héroïne} qu’on aime paie moins cher. Les marchands aussi lisent les visages.
  'venues.market.chat[4]': 'Gaspard me debe tres sacos de café. No le diga que llevo la cuenta.', // Gaspard me doit trois sacs de café. Ne lui dites pas que je compte.
  'venues.market.tips[0]': 'Entre nosotros,', // Entre nous,
  'venues.market.tips[1]': 'Mis clientes charlan:', // Mes clients bavardent :
  'venues.market.tips[2]': 'Una comerciante lo oye todo:', // Une marchande entend tout :
  'venues.market.glad[0]': 'Hmpf. Buen golpe.', // Hmpf. Joli coup.
  'venues.market.glad[1]': '¡Me está ahogando!', // Vous m’étranglez !
  'venues.market.glad[2]': '¿De dónde saca ese talento?', // D’où sortez-vous ce talent ?
  'venues.market.cross[0]': '¡Ja! No.', // Ha ! Non.
  'venues.market.cross[1]': 'Usted sueña.', // Vous rêvez.
  'venues.market.cross[2]': '¿A ese precio? Jamás.', // À ce prix-là ? Jamais.
  'venues.market.okay[0]': 'Sea…', // Soit…
  'venues.market.okay[1]': 'Bueno, bueno.', // Bon, bon.
  'venues.market.okay[2]': 'Es usted duro.', // Vous êtes dur.
  'venues.market.pushed[0]': '¡¿Otra vez?!', // Encore ?!
  'venues.market.pushed[1]': 'Abusa usted…', // Vous abusez…
  'venues.market.pushed[2]': 'Mi paciencia tiene un precio.', // Ma patience a un prix.
  'venues.market.gone': '¡Basta! Guárdese su oro, yo me quedo mi mercancía.', // Assez ! Gardez votre or, je garde ma marchandise.
  'venues.market.after[0]': 'Quiso demasiado. Vuelva cuando sepa detenerse.', // Vous avez voulu trop. Revenez quand vous saurez vous arrêter.
  'venues.market.after[1]': 'Un pequeño negocio. Honrado. Demasiado honrado para mí.', // Une petite affaire. Honnête. Trop honnête pour moi.
  'venues.market.after[2]': 'Bien negociado. Mis precios le sonreirán un tiempo.', // Bien négocié. Mes prix vous souriront un moment.
  'venues.market.after[3]': '¡Me ha desplumado! Todo el mercado habla ya de ello… Precio de amiga, por un tiempo.', // Vous m’avez dépouillée ! Tout le marché en parle déjà… Prix d’amie, pour un temps.
  'venues.forge.name': 'La Forja de Bram', // La Forge de Bram
  'venues.forge.title': 'Batir el hierro', // Battre le fer
  'venues.forge.unit': '% de calidad', // % de qualité
  'venues.forge.how': 'Golpee cuando la marca llegue al yunque y mantenga el calor en su franja con el fuelle. Una cadena de golpes certeros hace volar las chispas.', // Frappez quand la marque arrive sur l’enclume, et gardez la chaleur dans sa bande avec le soufflet. Une chaîne de coups justes fait voler les étincelles.
  'venues.forge.keys': 'Espacio o clic: golpear. B, ↑ o clic derecho: fuelle.', // Espace ou clic : frapper. B, ↑ ou clic droit : soufflet.
  'venues.forge.greet': '¡Ah, {g:el héroe|la heroína}! Deje esa espada, tome este martillo. Una hoja se bate entre dos: yo sujeto, usted golpea.', // Ah, {g:le héros|l’héroïne} ! Posez cette épée, prenez ce marteau. Une lame, ça se bat à deux : moi je tiens, vous frappez.
  'venues.forge.ready[0]': 'El hierro está al rojo. ¿Usted golpea y yo sujeto?', // Le fer est au rouge. Vous frappez, je tiens ?
  'venues.forge.ready[1]': 'Tengo una hoja que espera su martillo. ¿El suyo?', // J’ai une lame qui attend son marteau. Le vôtre ?
  'venues.forge.ready[2]': 'El fuego está bueno. Enséñeme ese brazo.', // Le feu est bon. Montrez-moi ce bras.
  'venues.forge.wait[0]': 'El hierro se enfría, déjelo reposar. Volveremos a forjar en un rato.', // Le fer refroidit, laissez-le reposer. On reforgera tout à l’heure.
  'venues.forge.wait[1]': 'Mis brazos también necesitan un respiro. Vuelva más tarde.', // Mes bras aussi ont besoin d’une pause. Revenez plus tard.
  'venues.forge.chat[0]': 'Buena madera, buen hierro, y le hago una leyenda.', // Du bon bois, du bon fer, et je vous fais une légende.
  'venues.forge.chat[1]': 'A una hoja se la respeta. Y se la refuerza.', // Une lame, ça se respecte. Et ça se renforce.
  'venues.forge.chat[2]': '{g:El héroe|La heroína} rompe, yo arreglo.', // {g:Le héros|L’héroïne} casse, moi je répare.
  'venues.forge.chat[3]': '{g:Un héroe|Una heroína} que bate su propio hierro, eso le gusta a la gente. Vienen a mirar por la ventana.', // {g:Un héros|Une héroïne} qui bat son propre fer, les gens aiment ça. Ils viennent regarder par la fenêtre.
  'venues.forge.chat[4]': 'Dama Ysolde dice que mi hierro es caro. Nunca ha visto el suyo.', // Dame Ysolde dit que mon fer est trop cher. Elle n’a jamais vu le sien.
  'venues.forge.tips[0]': 'Entre martillazo y martillazo, oigo que', // Entre deux coups de marteau, j’entends que
  'venues.forge.tips[1]': 'Me lo dijeron los guardias:', // Les gardes me l’ont dit :
  'venues.forge.tips[2]': 'En la forja se sabe:', // Ça se sait à la forge :
  'venues.forge.glad[0]': '¡Eso es!', // Voilà !
  'venues.forge.glad[1]': '¡Bien golpeado!', // Bien frappé !
  'venues.forge.glad[2]': '¡Canta!', // Ça chante !
  'venues.forge.cross[0]': '¡Fallo!', // Raté !
  'venues.forge.cross[1]': '¡El ritmo!', // Le rythme !
  'venues.forge.cross[2]': '¡Escuche el hierro!', // Écoutez le fer !
  'venues.forge.chain[0]': '¡Eso es forjar!', // Ça, c’est forger !
  'venues.forge.chain[1]': '¡Cómo canta!', // Elle chante !
  'venues.forge.cold': '¡Demasiado frío! ¡El fuelle!', // Trop froid ! Le soufflet !
  'venues.forge.hot': '¡Quema! ¡Despacio!', // Ça brûle ! Doucement !
  'venues.forge.after[0]': 'Esta hoja irá a la chatarra. Volveremos a empezar.', // Cette lame-là ira aux clous. On recommencera.
  'venues.forge.after[1]': 'Corta. Algo es algo.', // Elle coupe. C’est déjà ça.
  'venues.forge.after[2]': '¡Buena hoja! Su brazo la recordará en combate.', // Belle lame ! Votre bras s’en souviendra au combat.
  'venues.forge.after[3]': '¡Una hoja de leyenda! Golpee así en combate y nada resistirá.', // Une lame de légende ! Frappez comme ça au combat et rien ne tiendra.
  'venues.bakery.name': 'La Panadería', // La Boulangerie
  'venues.bakery.title': 'La hornada', // La fournée
  'venues.bakery.unit': 'panes dorados', // pains dorés
  'venues.bakery.how': 'Cada horno cuece un pan, de pálido a dorado y luego tostado, y al final se quema. Sáquelo cuando esté dorado, en el corazón de la ventana si puede. Cuatro panes quemados y la hornada está perdida.', // Chaque four cuit un pain, de pâle à doré puis foncé, et il brûle au bout. Sortez-le quand il est doré, au cœur de la fenêtre si vous pouvez. Quatre pains brûlés, et la fournée est perdue.
  'venues.bakery.keys': 'Una tecla por horno (1, 2, 3…), o clic en un horno. Dorado: 2, en el corazón: 3, tostado: 1, pálido: nada.', // Une touche par four (1, 2, 3…), ou clic sur un four. Doré : 2, au cœur : 3, foncé : 1, pâle : rien.
  'venues.bakery.breads[baguette].name': 'Baguette', // Baguette
  'venues.bakery.breads[miche].name': 'Hogaza', // Miche
  'venues.bakery.breads[brioche].name': 'Brioche', // Brioche
  'venues.bakery.greet': '¡Pase, {g:mi niño|mi niña}, que junto a los hornos se está bien! Aquí madrugamos más que el gallo para que todo Aubeval tenga su pan. Y cuando todas las hornadas cuecen a la vez, dos manos más nunca sobran.', // Entrez donc, {g:mon grand|ma grande}, il fait bon près des fours ! Ici on se lève avant le coq pour que tout Aubeval ait son pain. Et quand les fournées cuisent toutes à la fois, deux mains de plus ne sont jamais de trop.
  'venues.bakery.ready[0]': 'Los hornos están calientes y la masa ha subido. ¿Se arremanga?', // Les fours sont chauds et la pâte a levé. Vous retroussez vos manches ?
  'venues.bakery.ready[1]': 'Mis hornos están todos encendidos a la vez, y yo solo tengo dos manos. ¿Me presta las suyas?', // Mes fours chauffent tous à la fois, et je n’ai que deux mains. Vous me prêtez les vôtres ?
  'venues.bakery.ready[2]': 'La hornada solo le espera a usted. Y cuidado: el pan no espera a nadie.', // La fournée n’attend que vous. Et gare : un pain, ça n’attend personne.
  'venues.bakery.wait[0]': 'La masa está subiendo, y eso no se apresura. Vuelva dentro de un rato, le guardo un sitio junto al horno.', // La pâte lève, et ça ne se presse pas. Revenez tout à l’heure, je vous garde une place près du four.
  'venues.bakery.wait[1]': 'Estoy amasando la próxima hornada. Pase dentro de un momento… y llévese un currusco al salir.', // Je pétris la prochaine fournée. Repassez dans un moment… et prenez donc un croûton en sortant.
  'venues.bakery.chat[0]': 'Una hogaza caliente y el mundo va mejor.', // Une miche chaude et le monde va mieux.
  'venues.bakery.chat[1]': 'Harina, agua, sal y una noche de paciencia: el buen pan no pide nada más.', // Farine, eau, sel, et une nuit de patience : le bon pain ne demande rien d’autre.
  'venues.bakery.chat[2]': 'Sus campesinos comen por cuatro. Mejor así: un pueblo que come bien es un pueblo que canta.', // Vos paysans mangent comme quatre. Tant mieux : un village qui mange bien est un village qui chante.
  'venues.bakery.chat[3]': '¿{g:Un héroe|Una heroína} que se va a pelear con el estómago vacío? No mientras yo lleve este obrador. Tome, un brioche, y sin remilgos.', // {g:Un héros|Une héroïne} qui part se battre le ventre creux ? Pas tant que je tiens ce fournil. Tenez, une brioche, et pas de manières.
  'venues.bakery.chat[4]': 'Gaspard moja mis cruasanes en su café. Hago como que no lo veo… y le guardo dos más.', // Gaspard trempe mes croissants dans son café. Je fais semblant de ne pas voir… et je lui en garde deux de plus.
  'venues.bakery.tips[0]': 'En el obrador no se habla de otra cosa:', // Au fournil, on ne parle que de ça :
  'venues.bakery.tips[1]': 'Mis clientes de la mañana me lo soltaron con el cambio:', // Mes clients du matin me l’ont glissé avec la monnaie :
  'venues.bakery.tips[2]': 'Se comenta entre dos hornadas:', // Ça se dit entre deux fournées :
  'venues.bakery.glad[0]': '¡Dorado a punto!', // Doré à point !
  'venues.bakery.glad[1]': '¡Eso sí que es pan!', // Ah, ça, c’est du pain !
  'venues.bakery.glad[2]': '¡Huela qué corteza!', // Sentez-moi cette croûte !
  'venues.bakery.cross[0]': '¡Demasiado pronto, está pálido!', // Trop tôt, il est tout pâle !
  'venues.bakery.cross[1]': 'Aún pálido…', // Encore pâle…
  'venues.bakery.cross[2]': '¡Un poco de paciencia!', // Patience, voyons !
  'venues.bakery.lost[0]': '¡Huele a quemado!', // Ça sent le brûlé !
  'venues.bakery.lost[1]': '¡El horno! ¡El horno!', // Le four ! Le four !
  'venues.bakery.lost[2]': 'Ay, mi pobre pan…', // Oh, mon pauvre pain…
  'venues.bakery.after[0]': 'Todo se quemó… Abrimos las ventanas, echamos el humo y volvemos a empezar. No es más que pan.', // Tout a brûlé… On ouvre les fenêtres, on chasse la fumée, et on recommence. Ce n’est que du pain.
  'venues.bakery.after[1]': 'Unos cuantos panes buenos, y vecinos que no se acostarán con el estómago vacío. Es un comienzo.', // Quelques bons pains, et des voisins qui ne se coucheront pas le ventre vide. C’est un début.
  'venues.bakery.after[2]': '¡Buena hornada! Toda la calle huele a pan caliente, y las casas sonríen.', // Belle fournée ! Toute la rue sent le pain chaud, et les maisons ont le sourire.
  'venues.bakery.after[3]': '¡Una hornada de rey! Todo Aubeval tendrá pan caliente esta noche… y todos sabrán qué manos lo sacaron del horno.', // Une fournée de roi ! Tout Aubeval aura du pain chaud ce soir… et chacun saura quelles mains l’ont sorti du four.
  'venues.barracks.name': 'El Cuartel', // La Caserne
  'venues.barracks.title': '¡En guardia!', // Parade !
  'venues.barracks.unit': 'paradas', // parades
  'venues.barracks.how': 'La capitana anuncia un lado: alce el escudo de ese lado antes de que se cierre el anillo. Cuanto más gane, más se complica: fintas, donde la orden cambia y quien ya paró recibe el golpe, y luego golpes dobles. Cinco golpes recibidos y el ejercicio se pierde.', // La capitaine annonce un côté : levez le bouclier de ce côté avant que l’anneau se referme. Plus vous gagnez, plus ça se corse : feintes, où l’ordre change en route et qui a déjà paré est touché, puis coups doubles. Cinq coups reçus, et l’exercice est perdu.
  'venues.barracks.keys': 'Flechas o clic en un lado. Lado equivocado, o tarde: tocado.', // Flèches ou clic sur un côté. Mauvais côté, ou trop tard : touché.
  'venues.barracks.sides[up].name': 'Arriba', // Haut
  'venues.barracks.sides[up].shout': '¡Arriba!', // En haut !
  'venues.barracks.sides[right].name': 'Derecha', // Droite
  'venues.barracks.sides[right].shout': '¡A la derecha!', // À droite !
  'venues.barracks.sides[down].name': 'Abajo', // Bas
  'venues.barracks.sides[down].shout': '¡Abajo!', // En bas !
  'venues.barracks.sides[left].name': 'Izquierda', // Gauche
  'venues.barracks.sides[left].shout': '¡A la izquierda!', // À gauche !
  'venues.barracks.greet': '¡Firmes! Ah, es {g:el héroe|la heroína}. Aquí no se entra a mirar: se toma un escudo. Mis reclutas golpean, usted para, y toda la tropa aprende viéndole hacer.', // Garde à vous ! Ah, c’est {g:le héros|l’héroïne}. Ici, on n’entre pas pour regarder : on prend un bouclier. Mes recrues frappent, vous parez, et toute la troupe apprend en vous voyant faire.
  'venues.barracks.ready[0]': 'Un recluta espera su turno, espada de madera en el puño. ¡Escudo al brazo, y a su puesto!', // Une recrue attend son tour, l’épée de bois au poing. Bouclier au bras, et en position !
  'venues.barracks.ready[1]': '¿Ha sonado el cuerno? Entonces no hay tiempo que perder: un ejercicio antes de que lleguen los goblins, y mis soldados golpearán más fuerte.', // La corne a sonné ? Alors pas de temps à perdre : un exercice avant que les gobelins n’arrivent, et mes soldats frapperont plus fort.
  'venues.barracks.ready[2]': 'Mis reclutas necesitan ver cómo se para un golpe. Enséñeselo, {g:héroe|heroína}. Yo anuncio, usted para.', // Mes recrues ont besoin de voir comment on pare. Montrez-leur, {g:héros|héroïne}. J’annonce, vous parez.
  'venues.barracks.wait[0]': 'La tropa recobra el aliento. Descanso, pero no mucho: seguimos con el ejercicio dentro de un rato.', // La troupe souffle. Repos, mais pas trop longtemps : on reprend l’exercice tout à l’heure.
  'venues.barracks.wait[1]': 'Estoy pasando lista y contando los chichones. Vuelva dentro de un momento, el escudo le espera.', // Je fais l’appel et je compte les bosses. Repassez dans un moment, le bouclier vous attend.
  'venues.barracks.chat[0]': 'Una parada vale más que dos vendas.', // Une parade vaut mieux que deux bandages.
  'venues.barracks.chat[1]': 'El miliciano guarda la puerta, el arquero guarda la muralla, y yo los guardo a los dos.', // Le milicien tient la porte, l’archer tient le mur, et moi je les tiens tous les deux.
  'venues.barracks.chat[2]': 'Mis reclutas llegan campesinos y se van soldados. Entre una cosa y otra, estoy yo.', // Mes recrues arrivent paysans et repartent soldats. Entre les deux, il y a moi.
  'venues.barracks.chat[3]': '{g:Un héroe|Una heroína} que toma el escudo con la tropa vale más que todos mis discursos. Hasta los más jóvenes se ponen más derechos.', // {g:Un héros|Une héroïne} qui prend le bouclier avec la troupe, ça vaut tous mes discours. Même les plus jeunes se tiennent plus droit.
  'venues.barracks.chat[4]': 'Bram forja las hojas, Mélisande alimenta a la tropa. Yo les enseño a todos a seguir con vida.', // Bram forge les lames, Mélisande nourrit la troupe. Moi, j’apprends à tout ce monde à rester en vie.
  'venues.barracks.tips[0]': 'Informe de la guardia:', // Rapport de la garde :
  'venues.barracks.tips[1]': 'Mis centinelas me lo han señalado:', // Mes sentinelles me l’ont signalé :
  'venues.barracks.tips[2]': 'En la formación de la mañana, se comentaba en las filas:', // Au rassemblement du matin, ça se disait dans les rangs :
  'venues.barracks.glad[0]': '¡Bien visto!', // Bien vu !
  'venues.barracks.glad[1]': '¡Buena parada!', // Belle parade !
  'venues.barracks.glad[2]': '¡Eso es un escudo!', // Voilà un bouclier !
  'venues.barracks.glad[3]': 'No está mal. Nada mal.', // Pas mal. Pas mal du tout.
  'venues.barracks.cross[0]': '¡El otro lado!', // L’autre côté !
  'venues.barracks.cross[1]': '¡Escuche la orden!', // Écoutez l’ordre !
  'venues.barracks.cross[2]': '¡Por ahí no!', // Pas par là !
  'venues.barracks.lost[0]': '¡Demasiado lento!', // Trop lent !
  'venues.barracks.lost[1]': '¡El escudo, vamos!', // Le bouclier, voyons !
  'venues.barracks.lost[2]': '¿Nos dormimos?', // On dort ?
  'venues.barracks.feinted[0]': '¡Finta! La orden ha cambiado.', // Feinte ! L’ordre a changé.
  'venues.barracks.feinted[1]': '¡Ha mordido el anzuelo!', // Vous avez mordu !
  'venues.barracks.feinted[2]': '¡Escuche la orden hasta el final!', // Écoutez jusqu’au bout !
  'venues.barracks.after[0]': 'Eso no era un ejercicio, era una pelea. Cúrese, y volvemos a empezar más tarde.', // Ce n’était pas un exercice, c’était une bagarre. Pansez-vous, et on reprend plus tard.
  'venues.barracks.after[1]': 'Sabe parar. Todavía no es una guardia, pero mis reclutas han visto cómo se sostiene un escudo.', // Ça pare. Pas encore une garde, mais mes recrues ont vu comment on tient un bouclier.
  'venues.barracks.after[2]': '¡Buena guardia! La tropa ha mirado, y golpeará más fuerte. No lo diré dos veces.', // Belle garde ! La troupe a regardé, et elle frappera plus fort. Je ne le dirai pas deux fois.
  'venues.barracks.after[3]': '¡Una guardia de leyenda! En todo el cuartel no se habla más que de usted, y mis soldados golpean como nunca. Estoy orgullosa de ellos… y de usted.', // Une garde de légende ! Toute la caserne ne parle que de vous, et mes soldats frappent comme jamais. Je suis fière d’eux… et de vous.
  'venues.lodge.name': 'La Logia de los constructores', // La Loge des bâtisseurs
  'venues.lodge.title': 'La piedra justa', // La bonne pierre
  'venues.lodge.unit': 'piedras puestas', // pierres posées
  'venues.lodge.how': 'El muro sube, y en él queda un hueco: de las cuatro piedras talladas, solo una encaja. Una piedra se gira, nunca se le da la vuelta. Cuatro piedras equivocadas, y el muro se derrumba.', // Le mur monte, et il y reste un trou : des quatre pierres taillées, une seule y entre. Une pierre se tourne, elle ne se retourne jamais. Quatre mauvaises pierres, et le mur s’écroule.
  'venues.lodge.keys': 'Teclas 1 a 4, o clic en una piedra. Piedra justa: 1; deprisa y sin fallos, desde la tercera de una cadena: 2.', // Touches 1 à 4, ou clic sur une pierre. Bonne pierre : 1 ; vite et sans faute, dès la troisième d’une chaîne : 2.
  'venues.lodge.greet': '¡{g:Bienvenido|Bienvenida} a la Logia, burgomaestre! Aquí trazo los planos de Aubeval, y aquí aprenden el oficio mis oficiales. Un buen constructor elige su piedra de un vistazo: venga a enseñarme el suyo, y mis planos le harán construir por menos.', // Bienvenue à la Loge, bourgmestre ! C’est ici que je dresse les plans d’Aubeval, et que mes compagnons apprennent le métier. Un bon bâtisseur choisit sa pierre d’un coup d’œil : venez me montrer le vôtre, et mes plans vous feront bâtir à moindres frais.
  'venues.lodge.ready[0]': 'El muro espera su próxima hilada. Tome una piedra, burgomaestre, ¡y veamos ese ojo!', // Le mur attend sa prochaine assise. Prenez une pierre, bourgmestre, et voyons ce coup d’œil !
  'venues.lodge.ready[1]': 'Mis oficiales han tallado un montón de piedras, y solo una encaja en el hueco. ¡A usted le toca encontrarla, y deprisa!', // Mes compagnons ont taillé tout un tas de pierres, et une seule entre dans le trou. À vous de la trouver, et vite !
  'venues.lodge.ready[2]': '¿Le apetece una lección de constructora? Un muro se levanta piedra a piedra, sin dudar. Yo le enseño el hueco, usted elige la piedra.', // Une leçon de bâtisseuse, ça vous dit ? Un mur se monte pierre après pierre, sans hésiter. Je vous montre le trou, vous choisissez la pierre.
  'venues.lodge.wait[0]': 'Mis oficiales tallan piedras nuevas. Vuelva dentro de un rato: el muro, al menos, no se moverá.', // Mes compagnons taillent de nouvelles pierres. Repassez tout à l’heure : le mur, lui, ne bougera pas.
  'venues.lodge.wait[1]': 'Repaso mis planos un momento. Y amplíe la Logia, burgomaestre: con cada nivel, mis planos le sirven más tiempo.', // Je reprends mes plans un moment. Et agrandissez donc la Loge, bourgmestre : à chaque niveau, mes plans vous servent plus longtemps.
  'venues.lodge.chat[0]': 'Antes de poner una piedra, se mira. Luego se vuelve a mirar. Y una vez puesta, ya no se mira: está en su sitio.', // Avant de poser une pierre, on la regarde. Puis on la regarde encore. Et une fois posée, on ne la regarde plus : elle est à sa place.
  'venues.lodge.chat[1]': 'Un muro recto, burgomaestre, es un muro que aguanta cien años. Mire estas juntas: ¡no cabría ni un pelo!', // Un mur droit, bourgmestre, c’est un mur qui tient cent ans. Regardez-moi ces joints : pas un cheveu n’y passerait !
  'venues.lodge.chat[2]': 'Una piedra se gira en la mano, nunca se le da la vuelta: su cara labrada debe quedar fuera. Recuérdelo, y sabrá más que muchos albañiles.', // Une pierre se tourne dans la main, elle ne se retourne pas : sa face taillée doit rester dehors. Retenez ça, et vous en saurez plus que bien des maçons.
  'venues.lodge.chat[3]': '{g:Un héroe|Una heroína} que sabe levantar un muro recto, eso no se ve a menudo. Mis oficiales todavía hablan de ello, y se mantienen más derechos que sus plomadas.', // {g:Un héros|Une héroïne} qui sait monter un mur droit, on n’en voit pas souvent. Mes compagnons en parlent encore, et se tiennent plus droits que leurs fils à plomb.
  'venues.lodge.chat[4]': 'Bram me forja los cinceles, Doña Ysolde me vende la piedra demasiado cara. Cada cual con su oficio, y el mío es que todo se tenga en pie.', // Bram me forge mes ciseaux, Dame Ysolde me vend ma pierre trop cher. Chacun son métier, et le mien, c’est que tout tienne debout.
  'venues.lodge.tips[0]': 'En mis planos veo esto:', // Sur mes plans, je vois ceci :
  'venues.lodge.tips[1]': 'Mis oficiales me lo han señalado desde lo alto del andamio:', // Mes compagnons me l’ont signalé du haut de l’échafaudage :
  'venues.lodge.tips[2]': 'Un consejo de constructora, burgomaestre:', // Un conseil de bâtisseuse, bourgmestre :
  'venues.lodge.glad[0]': '¡Encaja!', // Elle entre !
  'venues.lodge.glad[1]': '¡Bien visto!', // Bien vu !
  'venues.lodge.glad[2]': '¡Al milímetro!', // Juste au millimètre !
  'venues.lodge.glad[3]': '¡Eso es una hilada!', // Voilà une assise !
  'venues.lodge.cross[0]': '¡Mire mejor!', // Regardez mieux !
  'venues.lodge.cross[1]': '¡Esa no!', // Pas celle-là !
  'venues.lodge.cross[2]': '¡Primero el hueco, luego la piedra!', // Le trou d’abord, la pierre ensuite !
  'venues.lodge.chain[0]': '¡Qué ojo!', // Quel coup d’œil !
  'venues.lodge.chain[1]': '¡El muro sube solo!', // Le mur monte tout seul !
  'venues.lodge.chain[2]': '¡Eso es aprender el oficio!', // Voilà le métier qui rentre !
  'venues.lodge.after[0]': 'El muro se ha derrumbado… Solo es piedra, burgomaestre: se recoge y se vuelve a empezar. Todo maestro ha visto caer su primer muro.', // Le mur s’est écroulé… Ce n’est que de la pierre, bourgmestre : on la ramasse, et on recommence. Tous les maîtres ont vu tomber leur premier mur.
  'venues.lodge.after[1]': 'Unas cuantas hiladas puestas, y rectas además. Mis planos le harán ahorrar un poco en sus obras.', // Quelques rangs de posés, et droits avec ça. Mes plans vous feront gagner un peu sur vos chantiers.
  'venues.lodge.after[2]': '¡Buen muro! Las juntas apretadas, el aplomo justo. Mis planos son suyos un tiempo: sus obras costarán menos.', // Beau mur ! Les joints sont serrés, l’aplomb est juste. Mes plans sont à vous un moment : vos chantiers coûteront moins cher.
  'venues.lodge.after[3]': '¡Un muro de maestro! No cabría ni la hoja de un cuchillo. Mis mejores planos son suyos: sus obras costarán mucho menos, y todos sabrán qué ojo eligió esas piedras.', // Un mur de maître ! Je n’y glisserais pas une lame de couteau. Mes meilleurs plans sont à vous : vos chantiers coûteront bien moins cher, et chacun saura quel œil a choisi ces pierres.
});
