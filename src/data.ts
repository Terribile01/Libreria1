import { Book, AudioTrack, PersonalNote } from './types';

export const INITIAL_BOOKS: Book[] = [
  // Favoriti
  {
    id: 'fav-1',
    title: 'Cime Tempestose',
    author: 'Emily Brontë',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTof2g5AepIAd9phh_RggnGADHk9rEB-OdCrlUN0n_3CxG1t4db5oelVbK-mWdRr1-0U35AtAUC8meYiNn8GVSaqV3X8wPpZG-F6mxP3So3RbdKapPZ-GQvj8SUOA_uYhbs_p2wHNsY3cT_hZFInRD7AviPO4RF4PAAYpWG6GBEi00MHJYhN8et0E3DfJvjVF9GPKLlN-Uh6N7hdRPMjO-iJAzgqfxAzMyTmYTqhLxYm4GCmvaPy_3_8VKwzqYhjnh9lb3XIQNrlfw',
    category: 'Classici',
    description: 'La tragica e appassionata storia d\'amore tra Heathcliff e Catherine, ambientata nelle nebbiose brughiere dello Yorkshire. Un poema in prosa di insuperata potenza drammatica.',
    status: 'Preferiti'
  },
  {
    id: 'fav-2',
    title: 'Il Piccolo Principe',
    author: 'Antoine de Saint-Exupéry',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8e-wzZfSKEigPrVEuBZpP2EYQ6zFHfXcvDugJtcCLz7SjK6kPt0Npbn89CWctFQ6_J2iEz_6wG4EWk42NLXteKnlYSA5VuR1pAaBm9i5WaUPSEBqP0IoavwI4lkNndBbEF4-HcrsrUzYjKRRSnT7EMpEr2W1fzL22klpnUwan204z_HPTCFuVFViaWnSJkAiT3bqQGQfAj-mq_gQylnf0br9Ho-j4jXVCXVrrR68CzlGpVR6vk6jLO0AgEl9DK6qJy0UB-Z-Z3-wB',
    category: 'Classici',
    description: 'Un incontro straordinario nel deserto del Sahara tra un pilota e un piccolo bambino arrivato da un asteroide lontano. Una parabola sulla purezza dell\'infanzia e l\'essenza dell\'amore.',
    status: 'Preferiti'
  },
  {
    id: 'fav-3',
    title: 'L\'Elogio dell\'Ombra',
    author: 'Jun\'ichiro Tanizaki',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbIwoHuYs5tp7dctc75Po66HfxMIr94pA6hMS9olURMxssAF4bMFglT-Vlgwn3Egm7Lwp1D0zcvzaPlHsV9IXU_NdeBBsR1y0gLiWafRuvAwja1UVotOR8otTwdUWqFTM5t3WslE5VUVOx81ppnscxNgBG9qy4rA0-hFc3AawIDVL2Xtz7qWc7s6x25xTdEuU9ARqRKYMao0WPC84A7LARvzBwKLDiknYB9Tnify99OQpQeTCRIgnIIU2V4ccqUBMhSqfftCGsMPCB',
    category: 'Filosofia',
    description: 'Un saggio straordinario che celebra la penombra, la patina del tempo e la delicata bellezza delle tonalità discrete tipiche dell\'estetica tradizionale giapponese.',
    status: 'Preferiti'
  },
  {
    id: 'fav-4',
    title: 'Siddharta',
    author: 'Hermann Hesse',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrYau1uDJpXJzsVGo83yMqZEHRa6yNb5I4V7UtJ1KiNwA8itQBb00WxaDl_Ze-K7Ctatbv6Pl_SnOC0g5pr8m8HwmunVFsgwwYLtB_F8CQ1nnTBZkVSYydTMsjqRJcA0QpGS8yxRXPk8y9fdioyLr1-8Rzo2tPg6v56sF5fqFKuPdWWE3FpxXMW38hK8SdfJhnBu4P2WWOMlCsKsAt1hJ0UvZs9lVxWc6uL-92oIbUFI1V3C4-HFA6pBJf4Nr1LoeMarwahkw-atR3',
    category: 'Romanzi',
    description: 'Il cammino spirituale di un giovane indiano alla ricerca di se stesso, dell\'essenza della vita e della pace interiore attraverso l\'esperienza diretta e l\'ascolto del fiume.',
    status: 'Preferiti'
  },

  // Da Leggere
  {
    id: 'dl-1',
    title: 'Kafka sulla spiaggia',
    author: 'Haruki Murakami',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIHJp1LyQRf3dRxZMD_Hgh2f1-lrX5m1TMpAbkDIwL0xV-k_cfOZyunO2Pkjr_ExHxYwpJTH8ZUjDvjAE6GRpqujXNQwDKFAlfqvPNU8f8MsopB11cyhbXuq0nVitP2p8z1UuWNAKtwBiU52WnImNV-TCQFoWnL9iDm3rfFSCpgXJZ9JijrPDRRVQg8lUnCAijvnkfjT2FiP9FBC4qGFEsvFpKCFC4XLovdFpK787wtwaD_vmJiiF6Z3WS1LmyrDc-JbinxbY4JuOs',
    category: 'Romanzi',
    description: 'Un quindicenne fugge da casa diretto a sud, incrociando i destini di un anziano signore sensibile che parla con i gatti.',
    status: 'Da Leggere',
    extraLabel: 'GENNAIO 2024'
  },
  {
    id: 'dl-2',
    title: 'Stoner',
    author: 'John Williams',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDx685mS7hYTV2KbLTA84jdxi42fmxZmaU-hxCRDMW7HekmHyQDkINFSVaeb37OmUUx2m_L-h70xJhTaFEr7ULfaJH1CAhH55zztjijnTug67VW0EfuKU8-GMQrndlFpSyPY72ffvF9MGPxH86iHUizoLxO773BncgzsDqqqS5nsPPD3eV_jSj-qKjK-B8ASxsDad2dPFaZTsuo6i4PEJ5GO3Zpi9AcpcqZl_pPXPb3cw-qghbmOgRbbTgf2OYo07D7OftSKt6ku-TS',
    category: 'Classici',
    description: 'La vita apparentemente grigia e insignificante di un professore universitario di letteratura inglese, percorsa in realtà da una passione silenziosa ed eroica.',
    status: 'Da Leggere',
    extraLabel: 'FEBBRAIO 2024'
  },
  {
    id: 'dl-3',
    title: 'La vegetariana',
    author: 'Han Kang',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWKlj5K-PUA-5Gc5aWqMfwRJKcnhQtxmGAAWeWaPlmuoMde95fse6zYxy2h9rfRlqK_m9FVcf5oJZqdJBE9dJLf345416d17WOwkljrKkOVVgeVi7bYVW9aSbXSIWKTHx0F8HGQg1k2Bn_oWW8qra2RT7jzIPXGbJvp-0uAptFjf8UwwP-m2lEX-80smK9WU3io3-5F7dgA7lgEbFcaa9T2q1yH5D5VYcVjTo6PVKue_E-1DCVCejlQ-QJ6nR96dwVai3xcynmNWe3',
    category: 'Romanzi',
    description: 'La radicale decisione di una donna di smettere di consumare carne si trasforma in una bizzarra metamorfosi e attira violenza e incomprensioni familiari.',
    status: 'Da Leggere',
    extraLabel: 'MARZO 2024'
  },

  // Letti
  {
    id: 'l-1',
    title: 'Nausea',
    author: 'Jean-Paul Sartre',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEit_UnxqqtnntBag8Z0W03WUG7RMkqXEQer8T-lhkVjN2qmDXOGe8ogjJe106Z3d__yw8dzg9zfMpp5WqUS31KjOr4XEXqTL7u8hhcep5_wh0j8ek0YngphO1lCElZtXkZF9Et5u-GA528eo2bYSsj7jcR5UJx3AY3jJtmZlrIMxGDVUv-U-t2CQuSCHHlyz5NinFIrk5z77yd2_vKB5i0ikSlOghts5Nkd4yGvrnElu6uQ3RZYEYTaU8jgXEu5oWz51s06Q8ZSJv',
    category: 'Filosofia',
    description: 'Il diario intimo di Antoine Roquentin, che scopre con profondo sgomento l\'insensatezza radicale di ogni essere, provando un forte senso di nausea esistenziale.',
    status: 'Letti'
  },
  {
    id: 'l-2',
    title: '1984',
    author: 'George Orwell',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkEJmTZOER_DS-Bt5UlWnyTMLt6uElnp6ibueDbN76ibKTCZy_w_JXs50DH6sfJMxvndctNMDytuMZeWM9sZ9Eb1DeYiPMtdBqPC7W_chn-V5IfQ4tr3vMpGCil02xdbgVy_AiJlsI4dXisF5HptRUbW3MQDLJBfp3OnkGy2o1gcU7smVQUAy8PvwgPm1RGu5c-1n7YfaQVKSky4NaKrhKOuTgsFrnVDlOCSgimuoZlzaDAdhE2_A0Tvv-jg1HLVXOpQcpSj2PKnWU',
    category: 'Classici',
    description: 'La celebre distopia totalitaria di Orwell sul potere supremo del Grande Fratello, la falsificazione della realtà e la ribellione clandestina di Winston Smith.',
    status: 'Letti'
  },
  {
    id: 'l-3',
    title: 'Norwegian Wood',
    author: 'Haruki Murakami',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArbAsJW2HBPq1mstZu7HunlV-Y7eF4og6aXORlfuKJDDJAdXcupBNk1iEm07kp7CH1goWCw495HAcIyb1K2j7OjmXK52bPghv379w0CqcdJZYzitT7dZg9hRRdsQG5kPS6JK7thipOAD03WNd2KRl-pskYuv5xW3sj1E-Gg8C4UWzeNtjA72kxuhR4vO2GDWA1pcQLDc0lER68Q5oLbfrRIJb-GQAmF2rhB2aipWnrPig02aavcXvSyf7C1V2D_p1-hdEmYaJIisFj',
    category: 'Romanzi',
    description: 'Un romanzo malinconico e nostalgico sulla giovinezza, la perdita, la sessualità e i complessi grovigli sentimentali ambientato nella Tokyo anni \'60.',
    status: 'Letti'
  },
  {
    id: 'l-4',
    title: 'Anna Karenina',
    author: 'Lev Tolstoj',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcU4L9E4SzGxQpYFOWMFQCUqWyVnTGJTOjwPrsG-QGeu8lj7U9n0imAaD-AFwDzec5CXz55xzPBUhUHsyjoSt1Toiwx-v8Cu2oDglaJOmzZ9qUrPVkvzVxTyzZtFScsp8aXUt7-5RxZsLwxnzV0KgMpVeolANbQ53eXRY6-bGa4W3lgmF76jiuT7SVXzoiGfsm0kf33MsXXAzF02BIkBkKlh5NV-CjemTB7Wxu-XLpDPzR4HvSFZe0ZyJfuUKpsr6QfdJL1xHWTvLv',
    category: 'Classici',
    description: 'Il tragico destino di Anna, vittima delle ipocrisie aristocratiche dell\'alta società russa, in contrapposizione al percorso spirituale del possidente Levin.',
    status: 'Letti'
  },
  {
    id: 'l-5',
    title: 'La peste',
    author: 'Albert Camus',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKYsJXViEKxMZA90GrzbHW67MKeWEESC6F3mK6-ErddRxUrHrgh5o2fIPgbSgdwE71ZmcOH9W0LbFjiaQY4-JFpr9gPG2bsY-q1qFWG3o5SFMWRd6RXOtG_CWH59Ml_Whbk9TURLJF7ctf46aqek72aPYdmFehoW5SVHhgJJM09_atTOjCHfcAEmgTQa0GlTP34fJrOCYDAN84LSS-9y1XRkqHxY8ptv_edCH2MZLN4tkDz5j3L38dGMvj_CWoIm73iOiev7tYQSb9',
    category: 'Filosofia',
    description: 'La cronaca di un\'epidemia improvvisa a Orano si trasforma in una maestosa allegoria della solidarietà umana, del dovere morale e della ribellione contro l\'assurdo.',
    status: 'Letti'
  },
  {
    id: 'l-6',
    title: 'L\'idiota',
    author: 'Fëdor Dostoevskij',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCwbwciwVbO6hpsBO7V4X9bc1zEXnqU94235fk0uEmmKIDx3LUJgWpgSDuBVfxLIm_NeA8SaGzMSrAinFw-9RMcDQaKcfEMXqUvrWYu27AqeAUJqHFcU-k5rqfGAvauGZSd7yoCksG1iR59WpF_OSVcfJ79SQZSxb552bVJOpxHtarjWsaLQfLkFrfNfhtjfTu1vxBKjgpE77aQohm5LgrloSiMfAGEw2FyP_OQFItXSaUr4QBviCKdr1cO-IiWx3ggE3D_3uWsMbp',
    category: 'Classici',
    description: 'La figura messianica del principe Myškin, incarnazione di assoluta bontà e comprensione spirituale, che si scontra dolorosamente con le passioni oscure della nobiltà.',
    status: 'Letti'
  },

  // Dolci Consigli (Homepage Grid)
  {
    id: 'dc-1',
    title: 'Oltre il Giardino',
    author: 'Thomas Wright',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeqFC2SQ_i-uzVYfhjpgQnFSmrrO2GnPxC2GTvl8K5vNmu-vI65xeZ0SglUOEfdHs848Ayc01p6mMoDcUJJiMItCrml1VqN338G-gN4rQ7PuAl-YZKajkc08RpTgb-DsDP-M0N2nIOWT6bW-6WGJ4ZItIUuYImogphLS28dSqrp1qI7i_IJWmpZIVqTyA59hhQTbW6BBLjujj0z026kRKgLodRD6ICbSK0CLia_QYbqF7jJVpYYUFz0MnoqTl7ME1-dCaa2t1JcTxn',
    category: 'Filosofia',
    description: 'Una riflessione pacata e straordinaria sul rapporto tra lo scorrere delle stagioni in un frutteto selvatico e i flussi interiori della contemplazione umana.',
    status: 'Da Leggere'
  },
  {
    id: 'dc-2',
    title: 'L\'Eco dei Monti',
    author: 'Clara Riva',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQ95TNd8wzWitprXiSPlyrOBAvK8Fk3hRqRMfPIKe8mtf6DYxA2PRegr4--tYkCDRkSohzb1jW9dTG_NT3CGoiUiXqcjo6yxb00sdm0pRBXdt72kKUz4qrgLS6m-FAdOtZRfjwmo1Jy2PLZJWVzAfBJqI9e1mkGUvMdIfuxCOCXkOj14HhUtyqeU0LTGBGQ0BWpUd6enJDTopsNsi4rKDCVvixWu8BwLwSygMfuGGv1Od9winxe1OE64afZ7M-CT1WoYpFLt3nxjzA',
    category: 'Romanzi',
    description: 'La storia delicata di tre generazioni che si incrociano tra le vette alpine, riscoprendo lettere custodite sotto le travi di una vecchia malga.',
    status: 'Da Leggere'
  },
  {
    id: 'dc-3',
    title: 'Sussurri Antichi',
    author: 'Marco Fabbri',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIQolXXAWZtqUJayikpnqzbyHM2ZhDdHLfbrt6RzMFuGJnwX5tiujo8s93bHeHZ0oXrwZxyub8KeMlngTG1-8lHP3OGFuRv7W5RBfGYNqoiij50dLb9lsZw1EHpLTroMsaQAIo-Rtc31ZE298kNLezmhryVoHTueDxXxtBSjTIAPq9_84H6UZ8zB7_iegRcKjbICqrf3DLxNoZEiUw51ucclO_J9iLAsYbvjmrWFXNXnMUz1471fX3mv-A1CwvSO4Gip_6fY7A6Ocl',
    category: 'Filosofia',
    description: 'Estratti e insegnamenti tramandati da sottomissivi testi di saggezza mediterranea riconsiderati sotto la lente pacifica del vivere moderno.',
    status: 'Da Leggere'
  },
  {
    id: 'dc-4',
    title: 'Luce d\'Inverno',
    author: 'Sofia Conti',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXOFa3vnwx8V628g_89Nz-_tZC7uRzlAp_7IytiIemcp1GRXpX8YnpClKM3tX1ZWYU6Fl6xvbGXIHimIYcxvisq7n-nccJhcMANvwyDeXYf-dwUEG-qUD4X_NiTZz_gdNptN5wG05XTWwkbX2DhEeHerxZL7XlF-gOpNIjJG1lAJEzvKJXBBiBz8RqIul2ZPm6gQL9HxKTJzifaTs1s4PPgfSIM5orNcIPgd4dgdj5H-4gaypAiMU9TQ-9PafcCqNZqsViM-C8ZZH8',
    category: 'Poesia',
    description: 'Una raccolta di liriche sul freddo, la brina del primo mattino e l\'ispirazione sottile celata nei piccoli gesti di calore domestico.',
    status: 'Da Leggere'
  }
];

export const INITIAL_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'at-1',
    title: 'Le Onde del Silenzio',
    author: 'Elena Vitale',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAP9GfDoBn_8Rlvt9VYbiVluLz-FkULypIhdr2l1WncnVHfrFn2OaXxVYkIFQ1Zyqsw9m4PrYkfjnouVUWVm1aOeRHgE-cW1-6BuGdgYOeGGqULQc25rm-GC9EssLc5r2qhAjhGiX96DGUTdPkcUloeyXbZE380ZYn4eRXZzTJrubOUoDeynGVq8f-F6qgNC_Xi8eghFDahrkBb_fSwJfiMxdfwKzK1k8oqTA0ZnHqnUqWJqFUo8v9XHhGbBt7-X4a5lGl2RBr67-ym',
    chapter: 'Capitolo IV: La Quiete Prima dell\'Alba',
    chapterIndex: 3,
    durationSeconds: 2695, // 44m 55s approx
    transcript: [
      { time: 0, text: '...il mare non era mai stato così calmo, una distesa d\'argento che rifletteva i sogni di chi ancora non si era svegliato.' },
      { time: 15, text: 'Elena guardò l\'orizzonte, sentendo il peso delle parole non dette. Era il momento di lasciar andare il passato e abbracciare il silenzio che veniva.' },
      { time: 42, text: 'Le onde, appena percepibili, sussurravano segreti antichi alle conchiglie dormienti...' },
      { time: 60, text: 'Nessun faro brillava a disturbare la pace dell\'oscurità fusa con l\'acqua. Un respiro immenso e lento.' },
      { time: 90, text: '«Forse», pensò con un sorriso appena accennato, «è in questa assoluta assenza di risposte che risiede la verità.»' }
    ]
  },
  {
    id: 'at-2',
    title: 'Frammenti di Luce',
    author: 'Marco Rovere',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgha_eFmtKZVKHoAzm4eMT_SuN2wBgyA4hBmF0sWIBsar11hCtR3cbOE4NdUG9YDF6YOaM0Lt2USnobk_ahVXay4ikZLf-nGdNilvpkEZmzs_aL7NGs-b5ODIo6Y0ggsVt8Hl_B-E3kByoYFoVdVqYwqmINvWHYTT0d8pJM79kSOQod2Q67rfWphWpIFJGCuIi09NZE6zrzY6vOzRqKYvWpZaqQ28aEJtf8n_3LjtX5Vd7WURJwL6lAR8E8S3LB-7j53qz9iwsjnS6',
    chapter: 'Prologo: L\'Inizio del Cammino',
    chapterIndex: 0,
    durationSeconds: 1540,
    transcript: [
      { time: 0, text: 'Ogni libro è una candela accesa in una stanza buia. Non dissipa ogni ombra, ma rende la solitudine abitabile.' },
      { time: 20, text: 'Il cammino attraverso queste pagine comincia in punta di piedi, tra granelli di polvere illuminati dal sole.' }
    ]
  },
  {
    id: 'at-3',
    title: 'Il Giardino Pensile',
    author: 'Sonia Gialli',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6QijEWcFGS11qEE_tJn6M9yjp7NGaa6r-TBPXdBu12LN3iuahvqox2T3Yy470RkbUEinGTX7SjeCJ8EXPhWDEKq_EEg6qIRIyBTDRuxrfVQZzqii-r-r5EKsuPv8usy7IwzJGS3AlvacmA6quOdWDNU11LKIgAD2LocqLCKg25Twb3VX0dY_XU9ZlGpFMGkuqeSqewoKhdLUtXqEAdSYyvNatdEbUBLLWnJ6V15cLsahCzE_DpWV0jzWGPEoPCSVTMB_4VQx-yyyF',
    chapter: 'Capitolo I: Semi nella Terra Secca',
    chapterIndex: 1,
    durationSeconds: 3120,
    transcript: [
      { time: 0, text: 'Si può piantare la bellezza ovunque, persino sulle mura sterili della routine quotidiana.' },
      { time: 25, text: 'Un giardino pensile è il tentativo caparbio dell\'anima di arrampicarsi verso il cielo azzurro.' }
    ]
  },
  {
    id: 'at-4',
    title: 'Sentieri di Carta',
    author: 'Luigi Neri',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlo0vg9hQhwnrQiHQgJTZ690UCfFmtOaspjS6Ja486u78wRw3aneIQdcI-xNeiyktxbrsqiQDB-qpWjvVemdPvTDd4b8hXAS7LU2ifiVWeiqGmMf0AtnHD68ufpx2UCxFZQEnHAqAsdZ1ZKouT-frPI1FeYwYnem9enrekGFpf8CPnBeZS2X5fmaP6kJ-rbB2HyhjEOjkC-NYwzuvnSj5CCSYhp-p1OnAKLFs2b2B6B0wVCCrZIg7RHsbMLS_ZF_H8_x3etx8v3mHc',
    chapter: 'Capitolo IX: Le Orme della Memoria',
    chapterIndex: 9,
    durationSeconds: 2880,
    transcript: [
      { time: 0, text: 'I fogli spiegazzati di un vecchio taccuino odorano di pioggia, di camini lontani e di promesse fatte a se stessi.' },
      { time: 30, text: 'Percorrere questi sentieri non richiede mappe, ma solo una straordinaria disponibilità a smarrirsi.' }
    ]
  }
];

export const INITIAL_NOTES: PersonalNote[] = [
  {
    id: 'n-1',
    bookTitle: 'Il deserto dei Tartari',
    title: 'Riflessioni su\' Il deserto dei Tartari \'',
    content: 'La tensione dell\'attesa diventa quasi fisica. Buzzati riesce a trasmettere quella sensazione di tempo che scivola via tra le dita mentre aspettiamo qualcosa di grande che forse non accadrà mai...',
    date: 'Ieri',
    tags: ['CLASSICO', 'ESISTENZIALISMO']
  },
  {
    id: 'n-2',
    bookTitle: 'Memorie di Adriano',
    title: 'Citazioni da \' Memorie di Adriano \'',
    content: '"L\'uomo che legge, o che pensa, o che calcola, appartiene alla sua specie, non al suo sesso; nei suoi momenti migliori, sfugge persino all\'umano." Una frase che racchiude l\'intera essenza del leggere.',
    date: '12 Ottobre',
    tags: ['STORICO', 'FILOSOFIA']
  }
];

export const SUGGESTIVE_PROFILES = [
  {
    title: "L'Orizzonte Invisibile",
    author: "Elena Valeri",
    coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdkuYQqwE42bhMaCrxQEGJO21qPLDamQODobpWZXIu_KKp93jMDC-bfl89o1nVK0c87FzbQhlqxjvj-J0skZHBTmEni0qgiQy-aqXCdeXVHqB4iYS6PT9tY9YoEE-kqV2eQGHijewqyh38kVie-tEPMJhluTOCn6KWmp9E8ISCbUY8LbatJtYQa4qhEcaEYysjSvOgsOSqx6JROtNGl-AqT9SuAknMVNe8xf9YrtqvMBd1gjVyaYsryhCP0OIW8iwj9tvOeRH4-U5u",
    ratingSymbols: 3
  },
  {
    title: "Sussurri d'Inverno",
    author: "Marco Polo", // Actually from image
    coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB60Icjjz_kD5Z9E_whxbtzBIh3NC6FBcxqA0bm5ym1Uugq8hVBpWBha5FenVBDim4YFpRHT3Gl1wQvQGXuNTZaO12iH4hB_26MNxgjpHESk-I_itCk6GJHNBPJE7EmAa8IlVuWCRva_6i1yTdJUvqUTIFa5a_DJtq4p3LrfpDa_4N8QxUOt0LH6BdSH6KMsphsVIBRJoE_JDCjoJ8ft5_gvY362_XeXnfTdhHsN8vtQgbIZ7-4pv0yPDUCyWky-eqGutydIB-N0NC0",
    ratingSymbols: 2
  },
  {
    title: "L'Arte del Silenzio",
    author: "S. Moretti",
    coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgGMy2sillD5zq2-3a-nZV7mxdkPpVrLQAFba2wxE9cQ_Hh3IgAJkC1aQat6CYwtkI66SC-lxHhA_BcbhAiJq_w06tnWsdmOB03ieJCC1PfNFJXI0sDBb9sz6ajkNeSyQpePWx_IZgpqKFZELfwck5ciEhDP7Q32ZPaNShEogqJ_pGuotW4-msDkS2aW6mv3vvfUYuuIlpqzSplY-TTKmSxyWfDBOGuobEqwN-RfVdqN3FOkiUFcZc91LL87YVIHjyQmLdxqlqSFCO",
    ratingSymbols: 3
  },
  {
    title: "Frammenti di Luce",
    author: "Luisa D'Amico",
    coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2JqOxCiFEDTVvUa202BQ9lplqmq2G8tThJ5ZYdoqZ3rLHr77yjdrgmPzUUeEArBATYugRSJdzTfNCHPrat17ZGkXv4GPDOpFMotQBDEq6pQIvKxcRb9IMly7Bgj1eU-aa_6za_AFI-62HCVjvDF_1rDc1F9dRl20S_kjoRpoZ2N0NLivuA9FOLA-TViWqwAwHaC_KtbKlrBPEnPsHp2kfPCOqrqS4wpJZsD4tOkD2meru2pfocBNP4HuG9qrUv9iG7xSQi6gDevwU",
    ratingSymbols: 1
  }
];
