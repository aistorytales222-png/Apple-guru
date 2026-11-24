/* Always open at the top on reload (a #hash link still jumps to its section) */
if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
let userScrolled = false;
['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => addEventListener(ev, () => { userScrolled = true; }, { once: true, passive: true }));
const toTop = () => { if (!location.hash && !userScrolled) window.scrollTo({ top: 0, behavior: 'instant' }); };
toTop();
addEventListener('load', () => { toTop(); setTimeout(toTop, 150); setTimeout(toTop, 600); });
addEventListener('pageshow', toTop);

/* ===== Apple Guru Indradev ===== */
const PHONES = '9821552339 / 9855038339';
// Optional: URL of your AI backend so the bot can answer in ANY language. Leave '' to use the built-in bot
// (the built-in bot fully speaks English, Nepali and Hindi).
const AI_ENDPOINT = '';

/* ---------- Prices (from the official iPhone 18 poster) ---------- */
const MODELS = ['iPhone 18 Pro Max', 'iPhone 18 Pro', 'iPhone Duo'];
const PRICES = {
  '256GB': [279900, 259900, 430900],
  '512GB': [322900, 301900, 472900],
  '1TB':   [407900, 386900, 557900]
};
const rs = n => 'Rs. ' + n.toLocaleString('en-US') + '/-';
const $ = id => document.getElementById(id);

$('yr').textContent = new Date().getFullYear();
$('priceTable').innerHTML =
  '<tr><th>Storage</th>' + MODELS.map(m => `<th>${m}</th>`).join('') + '</tr>' +
  Object.entries(PRICES).map(([s, p]) => `<tr><td>${s}</td>${p.map(x => `<td>${rs(x)}</td>`).join('')}</tr>`).join('');

/* ---------- Reviews with clickable stars (saved in this browser) ---------- */
const list = $('reviewList'), summary = $('revSummary'), starBox = $('starPick'), starErr = $('starErr');
const starBtns = [...starBox.querySelectorAll('button')];
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let reviews = [];
try { reviews = JSON.parse(localStorage.getItem('ag_reviews') || '[]'); } catch (e) {}
let rating = 0;

function paintStars(n) {
  starBtns.forEach(b => b.classList.toggle('on', +b.dataset.v <= n));
}
function setRating(n) {
  rating = n; paintStars(n); starErr.hidden = true;
  starBtns.forEach(b => b.setAttribute('aria-checked', String(+b.dataset.v === n)));
}
starBtns.forEach(b => {
  b.addEventListener('click', () => setRating(+b.dataset.v));
  b.addEventListener('mouseenter', () => paintStars(+b.dataset.v));
  b.addEventListener('focus', () => paintStars(+b.dataset.v));
});
starBox.addEventListener('mouseleave', () => paintStars(rating));
starBox.addEventListener('focusout', () => paintStars(rating));

function showReviews() {
  if (reviews.length) {
    const avg = reviews.reduce((a, r) => a + r.s, 0) / reviews.length;
    const full = Math.round(avg);
    summary.hidden = false;
    summary.innerHTML = `<span class="big">${avg.toFixed(1)}</span><span class="st">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</span><span>${reviews.length} review${reviews.length > 1 ? 's' : ''}</span>`;
  } else summary.hidden = true;
  list.innerHTML = reviews.length
    ? reviews.map(r => `<div class="rev"><span class="st">${'★'.repeat(r.s)}${'☆'.repeat(5 - r.s)}</span> <b>${esc(r.n)}</b><p>${esc(r.t)}</p></div>`).join('')
    : '<p class="empty">No reviews yet. Bought something from Apple Guru? Be the first to share your experience.</p>';
}
$('reviewForm').addEventListener('submit', e => {
  e.preventDefault();
  const n = $('rName').value.trim(), t = $('rText').value.trim();
  if (!n || !t) return;
  if (!rating) { starErr.hidden = false; starBtns[0].focus(); return; }
  reviews.unshift({ n, s: rating, t });
  try { localStorage.setItem('ag_reviews', JSON.stringify(reviews)); } catch (err) {}
  e.target.reset(); setRating(0);
  showReviews();
});
showReviews();

/* ---------- Chatbot ---------- */
const chat = $('chat'), log = $('chatLog'), input = $('chatIn'), chatBtn = $('chatBtn');
let lang = null;            // 'en' | 'ne' | 'hi' | 'other' (null until chosen)
let chatHistory = [];
const pick = a => Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a;

const LANG_LABELS = { en: 'English', ne: 'नेपाली', hi: 'हिन्दी', other: 'Other language / अन्य भाषा' };

const T = {
  en: {
    hi: ['Hello and welcome to Apple Guru! How may I help you today?', 'Namaste! Welcome to Apple Guru Indradev. What would you like to know?'],
    ask: 'You can ask me about prices, exchange, delivery, warranty or our location.',
    price: 'Here are our iPhone 18 series prices:\n' + MODELS.map((m, i) => `${m}: ${rs(PRICES['256GB'][i])} (256GB)`).join('\n') + '\nPlease tell me the model and storage, for example "iPhone 18 Pro 512GB". For other phones and accessories, kindly call ' + PHONES + '.',
    one: (m, s, p) => `${m} ${s} is ${p}. It is 100% original with official warranty. Please call ${PHONES} to order. Thank you!`,
    other: 'Prices of other phones, used phones and accessories change often. Kindly call or WhatsApp ' + PHONES + ' and we will happily share today\'s best price.',
    soon: 'The standard iPhone 18 is coming soon and the price has not been announced yet. Please stay tuned!',
    exch: 'Yes, we do offer exchange. Kindly bring your old phone to the shop and we will value it so you can upgrade.',
    del: 'We deliver all over Nepal, fast and safe, and 50% cash on delivery is available.',
    war: 'All our products are 100% original with official warranty and support.',
    loc: 'We are at Indradevmarga, Narayangarh, Chitwan. You can tap "Get directions" on this page, or call ' + PHONES + ' and we will guide you.',
    tel: 'You are always welcome to call or WhatsApp us on ' + PHONES + '.',
    thanks: ['You are most welcome! Is there anything else I can help you with?', 'My pleasure! Please let me know if you need anything else.'],
    bye: 'Thank you for visiting Apple Guru. Have a wonderful day!',
    fb: 'I am sorry, I did not fully understand. I can help with prices, exchange, delivery, warranty and location. For anything else, kindly call ' + PHONES + '.',
    otherLang: 'Of course, please type in your language and I will do my best to help. If I cannot understand, kindly WhatsApp us on ' + PHONES + ' and our team will reply.',
    noAI: 'I am sorry, I can chat fully only in English, Nepali and Hindi right now. Kindly WhatsApp or call ' + PHONES + ' and our team will help you in your language.',
    how: ['I am doing well, thank you for asking! How can I help you today?', 'I am great, thank you! Are you looking for an iPhone, an exchange or accessories?'],
    who: 'I am the virtual assistant of Apple Guru Indradev, Narayangarh. I can help with prices, exchange, delivery, warranty and accessories. For anything more, our team is always happy to talk on ' + PHONES + '.',
    ok: ['Sure! Is there anything else you would like to know?', 'Alright. Please feel free to ask anything about our phones.'],
    gm: 'Good day to you too! How may I help you?',
    disc: 'Our listed prices follow the official price list. For the best offer on your purchase or exchange, kindly call or WhatsApp ' + PHONES + ' and our team will tell you directly.',
    pay: 'For payment options such as EMI or installments, kindly call or WhatsApp ' + PHONES + ' so our team can confirm what is available. For deliveries, 50% cash on delivery is available.',
    used: 'Availability and prices of used or second-hand phones change daily. Kindly call or WhatsApp ' + PHONES + ' and we will tell you what is in stock today.',
    storage: 'A simple guide: 256GB is enough for most people, 512GB suits those who take many photos and videos, and 1TB is best for lots of 4K video or a big media library. You can see the price of each storage in the table on this page.',
    which: 'Usually the Pro Max has the larger screen and bigger battery, while the Pro is more compact and costs less. Prices: Pro Max 256GB ' + rs(279900) + ', Pro 256GB ' + rs(259900) + '. What matters most to you: camera, battery or budget? I will gladly help you choose.',
    acc: 'We have cases, chargers, earbuds, watches and more. Prices differ by item, so kindly call or WhatsApp ' + PHONES + ' for today\'s price.',
    service: 'Yes, we also provide phone service. Kindly bring your phone to the shop or call ' + PHONES + ' so our team can check it for you.',
    spec: 'For detailed specifications of a model, kindly see the posters in the "Latest from the shop" section or ask our team on ' + PHONES + '.',
    hours: 'To confirm today\'s shop timing, kindly call ' + PHONES + '.',
    chips: { price: 'Prices', exch: 'Exchange', del: 'Delivery', loc: 'Location', tel: 'Contact' }
  },
  ne: {
    hi: ['नमस्ते! Apple Guru मा हजुरलाई स्वागत छ। म हजुरलाई कसरी सहयोग गर्न सक्छु?', 'नमस्कार! Apple Guru इन्द्रदेवमा स्वागत छ। हजुरले के जान्न चाहनुहुन्छ?'],
    ask: 'हजुर मूल्य, एक्सचेन्ज, डेलिभरी, वारेन्टी वा पसलको ठेगानाबारे सोध्न सक्नुहुन्छ।',
    price: 'iPhone 18 सिरिजको मूल्य यस प्रकार छ:\n' + MODELS.map((m, i) => `${m}: ${rs(PRICES['256GB'][i])} (256GB)`).join('\n') + '\nकृपया मोडल र स्टोरेज भन्नुहोस्, जस्तै "iPhone 18 Pro 512GB"। अन्य फोन र एसेसरीजका लागि कृपया ' + PHONES + ' मा सम्पर्क गर्नुहोस्।',
    one: (m, s, p) => `${m} ${s} को मूल्य ${p} हो। यो १००% ओरिजिनल र आधिकारिक वारेन्टीसहित छ। अर्डरका लागि कृपया ${PHONES} मा फोन गर्नुहोस्। धन्यवाद!`,
    other: 'अन्य फोन, सेकेन्ड ह्यान्ड र एसेसरीजको मूल्य बारम्बार फेरिन्छ। कृपया ' + PHONES + ' मा फोन वा WhatsApp गर्नुहोस्, हामी आजको उत्तम मूल्य खुशीसाथ बताइदिनेछौं।',
    soon: 'स्ट्यान्डर्ड iPhone 18 चाँडै आउँदैछ, मूल्य अझै घोषणा भएको छैन। कृपया प्रतीक्षा गर्नुहोला।',
    exch: 'हजुर, एक्सचेन्ज सुविधा उपलब्ध छ। कृपया पुरानो फोन पसलमा ल्याउनुहोस्, हामी मूल्य लगाइदिन्छौं र हजुरले नयाँमा अपग्रेड गर्न सक्नुहुन्छ।',
    del: 'हामी सम्पूर्ण नेपालमा छिटो र सुरक्षित डेलिभरी गर्छौं, र ५०% क्यास अन डेलिभरी पनि उपलब्ध छ।',
    war: 'हाम्रा सबै सामान १००% ओरिजिनल छन् र आधिकारिक वारेन्टी तथा सपोर्टसहित आउँछन्।',
    loc: 'हामी इन्द्रदेवमार्ग, नारायणगढ, चितवनमा छौं। यस पेजको "Get directions" थिच्नुहोस्, वा ' + PHONES + ' मा फोन गर्नुहोस्, हामी बाटो बताइदिन्छौं।',
    tel: 'हजुर जुनसुकै बेला ' + PHONES + ' मा फोन वा WhatsApp गर्न सक्नुहुन्छ।',
    thanks: ['हजुरलाई स्वागत छ! अरू केही सहयोग चाहिएको छ?', 'धन्यवाद हजुर! अरू केही चाहिएमा भन्नुहोला।'],
    bye: 'Apple Guru मा आउनुभएकोमा धन्यवाद। हजुरको दिन शुभ रहोस्!',
    fb: 'माफ गर्नुहोला, मैले राम्ररी बुझिनँ। म मूल्य, एक्सचेन्ज, डेलिभरी, वारेन्टी र ठेगानामा सहयोग गर्न सक्छु। अरू कुराका लागि कृपया ' + PHONES + ' मा फोन गर्नुहोस्।',
    otherLang: 'हुन्छ, कृपया आफ्नो भाषामा लेख्नुहोस्, म सकेसम्म सहयोग गर्छु।',
    noAI: 'माफ गर्नुहोला, म अहिले अंग्रेजी, नेपाली र हिन्दीमा मात्र राम्ररी कुरा गर्न सक्छु। कृपया ' + PHONES + ' मा WhatsApp वा फोन गर्नुहोस्।',
    how: ['म ठीक छु, सोध्नुभएकोमा धन्यवाद हजुर! म हजुरलाई कसरी सहयोग गर्न सक्छु?', 'म सन्चै छु, धन्यवाद! हजुरलाई आईफोन, एक्सचेन्ज वा एसेसरीज चाहिएको हो?'],
    who: 'म Apple Guru इन्द्रदेव, नारायणगढको भर्चुअल सहायक हुँ। म मूल्य, एक्सचेन्ज, डेलिभरी, वारेन्टी र एसेसरीजमा सहयोग गर्न सक्छु। थप जानकारीका लागि हाम्रो टिमले ' + PHONES + ' मा खुशीसाथ कुरा गर्नेछ।',
    ok: ['हुन्छ हजुर! अरू केही जान्न चाहनुहुन्छ?', 'ठीक छ। हाम्रा फोनबारे जे पनि सोध्न सक्नुहुन्छ।'],
    gm: 'हजुरलाई पनि शुभ दिन! म हजुरलाई कसरी सहयोग गर्न सक्छु?',
    disc: 'हाम्रो मूल्य आधिकारिक मूल्यसूची अनुसार हो। किन्दा वा एक्सचेन्ज गर्दा उत्तम अफरका लागि कृपया ' + PHONES + ' मा फोन वा WhatsApp गर्नुहोस्, हाम्रो टिमले सिधै बताइदिनेछ।',
    pay: 'EMI वा किस्ता जस्ता भुक्तानी विकल्पका लागि कृपया ' + PHONES + ' मा फोन वा WhatsApp गर्नुहोस्, टिमले के उपलब्ध छ पुष्टि गर्नेछ। डेलिभरीमा ५०% क्यास अन डेलिभरी उपलब्ध छ।',
    used: 'सेकेन्ड ह्यान्ड फोनको उपलब्धता र मूल्य दिनहुँ फेरिन्छ। कृपया ' + PHONES + ' मा फोन वा WhatsApp गर्नुहोस्, आज के स्टकमा छ हामी बताइदिन्छौं।',
    storage: 'सजिलो गाइड: धेरैजनाका लागि २५६GB पुग्छ, धेरै फोटो र भिडियो खिच्नेका लागि ५१२GB राम्रो, र धेरै 4K भिडियो वा ठूलो मिडिया लाइब्रेरीका लागि १TB उत्तम हुन्छ। प्रत्येक स्टोरेजको मूल्य यही पेजको तालिकामा छ।',
    which: 'सामान्यतया Pro Max मा ठूलो स्क्रिन र ठूलो ब्याट्री हुन्छ, Pro अलि कम्प्याक्ट र सस्तो हुन्छ। मूल्य: Pro Max 256GB ' + rs(279900) + ', Pro 256GB ' + rs(259900) + '। हजुरलाई के कुरा महत्त्वपूर्ण छ: क्यामेरा, ब्याट्री कि बजेट? भन्नुभयो भने छान्न मद्दत गर्छु।',
    acc: 'हामीकहाँ केस, चार्जर, इयरबड्स, घडी र अरू धेरै सामान छन्। मूल्य सामान अनुसार फरक हुन्छ, कृपया आजको मूल्यका लागि ' + PHONES + ' मा फोन वा WhatsApp गर्नुहोस्।',
    service: 'हजुर, हामी फोनको सर्भिस पनि गर्छौं। कृपया फोन पसलमा ल्याउनुहोस् वा ' + PHONES + ' मा फोन गर्नुहोस्, टिमले जाँच गरिदिनेछ।',
    spec: 'कुनै मोडलको विस्तृत स्पेसका लागि कृपया "Latest from the shop" खण्डको पोस्टर हेर्नुहोस् वा हाम्रो टिमलाई ' + PHONES + ' मा सोध्नुहोस्।',
    hours: 'आजको पसल खुल्ने समय पुष्टि गर्न कृपया ' + PHONES + ' मा फोन गर्नुहोस्।',
    chips: { price: 'मूल्य', exch: 'एक्सचेन्ज', del: 'डेलिभरी', loc: 'ठेगाना', tel: 'सम्पर्क' }
  },
  hi: {
    hi: ['नमस्ते! Apple Guru में आपका स्वागत है। मैं आपकी क्या सहायता कर सकता हूँ?', 'नमस्कार! Apple Guru इंद्रदेव में आपका स्वागत है। आप क्या जानना चाहेंगे?'],
    ask: 'आप कीमत, एक्सचेंज, डिलीवरी, वारंटी या दुकान के पते के बारे में पूछ सकते हैं।',
    price: 'iPhone 18 सीरीज़ की कीमतें इस प्रकार हैं:\n' + MODELS.map((m, i) => `${m}: ${rs(PRICES['256GB'][i])} (256GB)`).join('\n') + '\nकृपया मॉडल और स्टोरेज बताइए, जैसे "iPhone 18 Pro 512GB"। अन्य फोन और एक्सेसरीज़ के लिए कृपया ' + PHONES + ' पर संपर्क करें।',
    one: (m, s, p) => `${m} ${s} की कीमत ${p} है। यह 100% ओरिजिनल और आधिकारिक वारंटी के साथ है। ऑर्डर के लिए कृपया ${PHONES} पर कॉल करें। धन्यवाद!`,
    other: 'अन्य फोन, पुराने फोन और एक्सेसरीज़ की कीमतें बदलती रहती हैं। कृपया ' + PHONES + ' पर कॉल या WhatsApp करें, हम आज की सबसे अच्छी कीमत खुशी से बताएँगे।',
    soon: 'स्टैंडर्ड iPhone 18 जल्द आ रहा है, कीमत अभी घोषित नहीं हुई है। कृपया प्रतीक्षा करें।',
    exch: 'जी हाँ, एक्सचेंज की सुविधा उपलब्ध है। कृपया अपना पुराना फोन दुकान पर लाइए, हम उसकी कीमत लगा देंगे।',
    del: 'हम पूरे नेपाल में तेज़ और सुरक्षित डिलीवरी करते हैं, और 50% कैश ऑन डिलीवरी भी उपलब्ध है।',
    war: 'हमारे सभी प्रोडक्ट 100% ओरिजिनल हैं और आधिकारिक वारंटी व सपोर्ट के साथ आते हैं।',
    loc: 'हम इंद्रदेवमार्ग, नारायणगढ़, चितवन में हैं। इस पेज पर "Get directions" दबाइए, या ' + PHONES + ' पर कॉल कीजिए।',
    tel: 'आप कभी भी ' + PHONES + ' पर कॉल या WhatsApp कर सकते हैं।',
    thanks: ['आपका स्वागत है! क्या मैं और कुछ मदद कर सकता हूँ?', 'धन्यवाद! और कुछ चाहिए तो ज़रूर बताइए।'],
    bye: 'Apple Guru आने के लिए धन्यवाद। आपका दिन शुभ हो!',
    fb: 'क्षमा कीजिए, मैं पूरी तरह समझ नहीं पाया। मैं कीमत, एक्सचेंज, डिलीवरी, वारंटी और पते में मदद कर सकता हूँ। बाकी के लिए कृपया ' + PHONES + ' पर कॉल करें।',
    otherLang: 'ज़रूर, कृपया अपनी भाषा में लिखिए, मैं पूरी कोशिश करूँगा।',
    noAI: 'क्षमा कीजिए, मैं अभी अंग्रेज़ी, नेपाली और हिन्दी में ही अच्छी तरह बात कर सकता हूँ। कृपया ' + PHONES + ' पर WhatsApp या कॉल करें।',
    how: ['मैं ठीक हूँ, पूछने के लिए धन्यवाद! मैं आपकी क्या सहायता कर सकता हूँ?', 'मैं बढ़िया हूँ, धन्यवाद! क्या आप आईफोन, एक्सचेंज या एक्सेसरीज़ देख रहे हैं?'],
    who: 'मैं Apple Guru इंद्रदेव, नारायणगढ़ का वर्चुअल सहायक हूँ। मैं कीमत, एक्सचेंज, डिलीवरी, वारंटी और एक्सेसरीज़ में मदद कर सकता हूँ। और जानकारी के लिए हमारी टीम ' + PHONES + ' पर खुशी से बात करेगी।',
    ok: ['जी ज़रूर! क्या आप कुछ और जानना चाहेंगे?', 'ठीक है। हमारे फोन के बारे में कुछ भी पूछिए।'],
    gm: 'आपका भी दिन शुभ हो! मैं आपकी क्या सहायता कर सकता हूँ?',
    disc: 'हमारी कीमतें आधिकारिक प्राइस लिस्ट के अनुसार हैं। खरीदने या एक्सचेंज पर सबसे अच्छे ऑफर के लिए कृपया ' + PHONES + ' पर कॉल या WhatsApp करें, हमारी टीम सीधे बताएगी।',
    pay: 'EMI या किस्त जैसे भुगतान विकल्पों के लिए कृपया ' + PHONES + ' पर कॉल या WhatsApp करें, टीम बताएगी कि क्या उपलब्ध है। डिलीवरी पर 50% कैश ऑन डिलीवरी उपलब्ध है।',
    used: 'पुराने फोन की उपलब्धता और कीमत रोज़ बदलती है। कृपया ' + PHONES + ' पर कॉल या WhatsApp करें, हम बताएँगे आज क्या स्टॉक में है।',
    storage: 'आसान गाइड: ज़्यादातर लोगों के लिए 256GB काफ़ी है, बहुत फोटो-वीडियो लेने वालों के लिए 512GB, और बहुत 4K वीडियो या बड़ी मीडिया लाइब्रेरी के लिए 1TB बेहतर है। हर स्टोरेज की कीमत इसी पेज की तालिका में है।',
    which: 'आमतौर पर Pro Max में बड़ी स्क्रीन और बड़ी बैटरी होती है, जबकि Pro थोड़ा कॉम्पैक्ट और सस्ता है। कीमत: Pro Max 256GB ' + rs(279900) + ', Pro 256GB ' + rs(259900) + '। आपके लिए क्या ज़रूरी है: कैमरा, बैटरी या बजट? बताइए, मैं चुनने में मदद करूँगा।',
    acc: 'हमारे पास केस, चार्जर, ईयरबड्स, घड़ियाँ और बहुत कुछ है। कीमत सामान के अनुसार अलग होती है, आज की कीमत के लिए कृपया ' + PHONES + ' पर कॉल या WhatsApp करें।',
    service: 'जी हाँ, हम फोन की सर्विस भी करते हैं। कृपया फोन दुकान पर लाइए या ' + PHONES + ' पर कॉल करें, टीम जाँच कर देगी।',
    spec: 'किसी मॉडल के पूरे स्पेक्स के लिए कृपया "Latest from the shop" सेक्शन के पोस्टर देखें या हमारी टीम से ' + PHONES + ' पर पूछें।',
    hours: 'आज दुकान के खुलने का समय पक्का करने के लिए कृपया ' + PHONES + ' पर कॉल करें।',
    chips: { price: 'कीमत', exch: 'एक्सचेंज', del: 'डिलीवरी', loc: 'पता', tel: 'संपर्क' }
  }
};

/* detect the language of what the visitor typed */
function detectLang(t) {
  if (/[\u0900-\u097F]/.test(t)) return /(कितना|क्या|है|चाहिए|कीमत|दाम|आप|मैं|नहीं|हाँ|जी)/.test(t) ? 'hi' : 'ne';
  if (/[^\u0000-\u024F\u2000-\u206F]/.test(t)) return 'other'; // another script (Chinese, Arabic, Thai, ...)
  return null;
}

function intent(t) {
  const x = t.toLowerCase();
  const T_ = r => r.test(x);
  // small talk first
  if (T_(/how are (you|u)|how r u|how do you do|hru\b|kasto cha|kasto xa|k cha\b|k xa\b|sanchai|कस्तो छ|कस्तो हुनुहुन्छ|कैसे हो|कैसे हैं|कैसा है|आप कैसे/)) return { k: 'how' };
  if (T_(/who are you|your name|are you (a )?(bot|human|real|ai|robot)|timro naam|तिम्रो नाम|तपाईंको नाम|आपका नाम|तुम कौन|आप कौन/)) return { k: 'who' };
  if (T_(/good\s*(morning|afternoon|evening|night)|सुप्रभात|शुभ\s*(प्रभात|सन्ध्या|रात्रि)/)) return { k: 'gm' };
  if (T_(/what can you do|can you help|help me|मद्दत|सहयोग|मदद/)) return { k: 'ask' };
  // buying advice and specs (before model names, so "which is better, pro or pro max?" works)
  if (T_(/which (phone|iphone|one|model|is better)|suggest|recommend|best (phone|iphone)|better|कुन|कौन सा|कौनसा|सुझाव|राम्रो/)) return { k: 'which' };
  if (T_(/spec|camera|battery|display|screen|chip|\bram\b|colou?r|क्यामेरा|ब्याट्री|बैटरी|रङ|रंग|कैमरा/)) return { k: 'spec' };
  const mi = /pro\s*max|प्रो\s*म्याक्स|प्रो\s*मैक्स/.test(x) ? 0 : /\bpro\b|प्रो/.test(x) ? 1 : /duo|ड्युओ|डुओ/.test(x) ? 2 : -1;
  const st = /1\s*tb|1टीबी/.test(x) ? '1TB' : /512/.test(x) ? '512GB' : /256/.test(x) ? '256GB' : null;
  if (mi >= 0) return { k: 'one', m: MODELS[mi], s: st || '256GB', p: rs(PRICES[st || '256GB'][mi]) };
  if (T_(/^(hi|hello|hey|namaste|namaskar|नमस्ते|नमस्कार)/)) return { k: 'hi' };
  if (T_(/thank|thanks|dhanyabad|dhanyawad|धन्यवाद|शुक्रिया/)) return { k: 'thanks' };
  if (T_(/\bbye\b|goodbye|good bye|अलविदा/)) return { k: 'bye' };
  if (T_(/^(ok|okay|k|fine|sure|alright|hmm+|yes|yeah|yep|ya|nice|good|great|cool)\b|^(हुन्छ|ठीक|हाँ|हो|जी)/)) return { k: 'ok' };
  if (T_(/used|second\s*-?\s*hand|old iphone|सेकेन्ड|सेकंड/)) return { k: 'used' };
  if (T_(/exchange|old phone|trade|एक्सचेन्ज|एक्सचेंज|पुरानो|पुराना/)) return { k: 'exch' };
  if (T_(/deliver|\bcod\b|cash on|shipping|डेलिभरी|डिलीवरी|पठाउ|भेज/)) return { k: 'del' };
  if (T_(/warrant|original|genuine|वारेन्टी|वारंटी|ओरिजिनल/)) return { k: 'war' };
  if (T_(/where|location|address|map|direction|ठेगाना|कहाँ|कहां|पता|लोकेसन/)) return { k: 'loc' };
  if (T_(/phone number|contact|call|whatsapp|number|नम्बर|नंबर|सम्पर्क|संपर्क/)) return { k: 'tel' };
  if (T_(/opening|closing|\bopen\b|\bclose\b|timing|hours|खुल्छ|खुल्ने|खुलता|खुलती/)) return { k: 'hours' };
  if (T_(/service|repair|broken|मर्मत|सर्भिस|सर्विस|रिपेयर/)) return { k: 'service' };
  if (T_(/discount|offer|bargain|last price|best price|final price|cheap|छुट|मोलमोलाई|अफर|डिस्काउन्ट|डिस्काउंट|छूट|सस्ता|सस्तो/)) return { k: 'disc' };
  if (T_(/\bemi\b|installment|instalment|payment|\bpay\b|esewa|khalti|fonepay|credit card|किस्ता|भुक्तानी|भुगतान|पेमेन्ट/)) return { k: 'pay' };
  if (T_(/iphone\s*18\b|standard|base/)) return { k: 'soon' };
  if (T_(/price|cost|rate|kati|how much|list|मूल्य|कति|कीमत|दाम|कितना|रेट/)) {
    return /samsung|oppo|vivo|xiaomi|redmi|realme|android|used|second|case|charger|airpod|watch|accessor|एसेसरी|एक्सेसरी/.test(x) ? { k: 'other' } : { k: 'price' };
  }
  if (T_(/storage|\d+\s*(gb|tb)|स्टोरेज|मेमोरी/)) return { k: 'storage' };
  if (T_(/accessor|\bcase\b|charger|airpod|earbud|earphone|headphone|watch|cable|एसेसरी|एक्सेसरी|चार्जर|केस|घडी|घड़ी/)) return { k: 'acc' };
  return { k: 'fb' };
}

function add(text, who) {
  const d = document.createElement('div');
  d.className = 'msg ' + who; d.textContent = text;
  log.appendChild(d); log.scrollTop = log.scrollHeight;
  return d;
}
function addChips(items) { // items: [{label, fn}]
  const box = document.createElement('div'); box.className = 'chips';
  items.forEach(it => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = it.label;
    b.onclick = () => { box.remove(); it.fn(); };
    box.appendChild(b);
  });
  log.appendChild(box); log.scrollTop = log.scrollHeight;
}
function quickChips() {
  const c = T[lang === 'other' ? 'en' : lang].chips;
  addChips(['price', 'exch', 'del', 'loc', 'tel'].map(k => ({ label: c[k], fn: () => { add(c[k], 'me'); answer(c[k], k); } })));
}
function askLanguage() {
  add('Welcome to Apple Guru! Please select your language.\nस्वागत छ! कृपया आफ्नो भाषा छान्नुहोस्।\nस्वागत है! कृपया अपनी भाषा चुनिए।', 'bot');
  addChips(Object.entries(LANG_LABELS).map(([code, label]) => ({ label, fn: () => chooseLang(code) })));
}
function chooseLang(code) {
  lang = code;
  add(LANG_LABELS[code], 'me');
  const L = T[code === 'other' ? 'en' : code];
  if (code === 'other') { add(L.otherLang, 'bot'); return; }
  add(pick(L.hi), 'bot'); add(L.ask, 'bot'); quickChips();
}

async function aiReply(text) {
  try {
    const r = await fetch(AI_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history: chatHistory.slice(-10), lang }) });
    const j = await r.json();
    return j.reply || null;
  } catch (e) { return null; }
}

async function answer(text, forcedKey) {
  const typing = add('…', 'bot'); typing.classList.add('typing');
  let out = null;
  if (AI_ENDPOINT && !forcedKey) out = await aiReply(text);
  if (!out) {
    const d = forcedKey ? null : detectLang(text);
    if (d === 'other') {
      out = T.en.noAI;
    } else {
      if (d && d !== 'other') lang = d;
      const L = T[lang === 'other' || !lang ? 'en' : lang];
      const i = forcedKey ? { k: forcedKey } : intent(text);
      const v = i.k === 'one' ? L.one(i.m, i.s, i.p) : L[i.k];
      out = pick(v);
    }
    await new Promise(r => setTimeout(r, 450)); // small pause so it feels human
  }
  typing.remove();
  const wasFb = !forcedKey && !AI_ENDPOINT && out === T[lang === 'other' || !lang ? 'en' : lang].fb;
  chatHistory.push({ role: 'user', content: text }, { role: 'assistant', content: out });
  add(out, 'bot');
  if (wasFb) quickChips();
}

$('chatForm').addEventListener('submit', e => {
  e.preventDefault();
  const t = input.value.trim(); if (!t) return;
  add(t, 'me'); input.value = '';
  if (!lang) lang = detectLang(t) || 'en';
  answer(t);
});
chatBtn.addEventListener('click', () => {
  chat.hidden = false; chatBtn.hidden = true;
  if (!log.children.length) askLanguage();
  input.focus();
});
$('chatClose').addEventListener('click', () => { chat.hidden = true; chatBtn.hidden = false; });

/* ---------- Poster lightbox ---------- */
const lb = $('lightbox'), lbImg = $('lbImg'), lbCap = $('lbCap');
document.querySelectorAll('.poster').forEach(b => b.addEventListener('click', () => {
  lbImg.src = b.dataset.src; lbCap.textContent = b.dataset.cap; lb.hidden = false;
}));
lb.addEventListener('click', e => { if (e.target !== lbImg) lb.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.hidden = true; });

/* ---------- Show which section the visitor is in ---------- */
const navLinks = [...document.querySelectorAll('nav a[href^="#"]:not(.nav-call)')];
const board = document.querySelector('.board');
const setActive = id => {
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
  board.classList.toggle('in-view', id === 'prices');
};
const spy = new IntersectionObserver(en => en.forEach(e => { if (e.isIntersecting && scrollY > 60) setActive(e.target.id); }), { rootMargin: '-30% 0px -60% 0px' });
['prices', 'services', 'reviews', 'contact'].forEach(id => { const el = $(id); if (el) spy.observe(el); });
addEventListener('scroll', () => { if (scrollY < 60) setActive(''); }, { passive: true });
navLinks.forEach(a => a.addEventListener('click', () => {
  if (a.getAttribute('href') !== '#prices') return;
  board.classList.remove('flash');
  setTimeout(() => board.classList.add('flash'), 500);
}));