import { SIZE_CHART, SIZES, BODY_CHART } from './products.js';

const sizeTable = () => `
  <table class="size-table"><thead><tr><th>Size</th>${SIZES.map((s) => `<th>${s}</th>`).join('')}</tr></thead><tbody>
  <tr><th>Height (cm)</th>${BODY_CHART.height.map((v) => `<td>${v - 3}–${v + 3}</td>`).join('')}</tr>
  <tr><th>Body chest (cm)</th>${BODY_CHART.chest.map((v) => `<td>${v - 3}–${v + 3}</td>`).join('')}</tr>
  <tr><th>M1 garment chest</th>${SIZE_CHART.m1.chest.map((v) => `<td>${v}</td>`).join('')}</tr>
  <tr><th>M1 back length</th>${SIZE_CHART.m1.length.map((v) => `<td>${v}</td>`).join('')}</tr>
  </tbody></table>`;

export const LEGAL = {
  shipping: { t: 'Shipping', b: `
    <p>Every piece ships from our studio in Prague within 24 hours on business days, in a reusable garment bag.</p>
    <h3>EU, UK, Switzerland, Norway</h3><ul><li>Standard (DHL): 2–4 business days — €12, free over €300</li><li>Express (DHL Express): 1–2 business days — €24</li><li>Showroom pickup in Prague — free, by appointment</li></ul>
    <h3>Duties &amp; taxes</h3><p>Prices include VAT. For the UK, Switzerland and Norway all duties are prepaid — nothing to pay on delivery.</p>
    <h3>Tracking</h3><p>You receive a tracking link by email the moment the parcel leaves the studio.</p>` },
  returns: { t: 'Returns & exchanges', b: `
    <p>Not right? Return it within 30 days of delivery, free, with the prepaid label in your parcel.</p>
    <ul><li>Unworn, with the cord tag still attached</li><li>Refund to the original payment method within 5 business days of arrival</li><li>Exchanges for another size are reserved for you the moment you request them — limited pieces don't sell out under you</li></ul>
    <p>Start a return from your confirmation email or write to care@naturik.studio with your order number.</p>` },
  sizing: { t: 'Size guide', b: `
    <p>The M1 is cut oversized by design: roomy enough for a hoodie and knit underneath. Most people take their usual size. Between sizes, size down for a cleaner line or up for maximum volume.</p>
    ${sizeTable()}
    <h3>How to measure</h3><ul><li><b>Chest</b> — around the fullest part, under the arms, tape level.</li><li><b>Height</b> — barefoot, back against a wall.</li><li><b>Garment chest</b> — the jacket laid flat, armpit to armpit, × 2.</li></ul>
    <p>Still unsure? Use “Find my size” on any product, or send us your height and usual size — we answer within a working day.</p>` },
  care: { t: 'Care & repair', b: `
    <ul><li>Air it out instead of washing — down stays loftier for longer.</li><li>When needed: delicate cycle at 30 °C with down wash, no softener.</li><li>Tumble dry low with 2–3 clean tennis balls until completely dry — this re-fluffs the cells.</li><li>Store hanging, never compressed.</li></ul>
    <h3>Lifetime repair</h3><p>Tears, failed zips, lost loft: we repair NATURIK outerwear for life. Repairs are free in the first two years, at cost after that.</p>` },
  terms: { t: 'Terms of sale', b: `
    <p><b>Demo store notice:</b> this website is a design prototype. No contract of sale is formed and no payment is taken.</p>
    <h3>1. Seller</h3><p>NATURIK (placeholder company details — to be completed before launch).</p>
    <h3>2. Orders</h3><p>An order is accepted when we send the shipping confirmation. Pieces in your bag are reserved for 15 minutes from the last one you added; after that they are released back to the drop. Max. 2 pieces per size per customer.</p>
    <h3>3. Prices</h3><p>All prices in EUR including VAT. Shipping costs are shown before you pay.</p>
    <h3>4. Warranty</h3><p>Statutory 24-month warranty plus our lifetime repair programme.</p>
    <h3>5. Disputes</h3><p>EU consumers may use the European Online Dispute Resolution platform.</p>` },
  privacy: { t: 'Privacy policy', b: `
    <p>We collect the minimum needed to deliver your order and answer your messages. We never sell your data.</p>
    <h3>What we collect and why</h3><ul><li><b>Orders</b> — name, delivery address, email and phone, to ship the parcel and send updates (contract).</li><li><b>Messages</b> — what you write through the contact form, to reply (legitimate interest).</li><li><b>Newsletter</b> — your email, only with your consent; unsubscribe in one click.</li></ul>
    <h3>How long we keep it</h3><p>Order records for 10 years (Czech accounting law), messages for 2 years, newsletter data until you unsubscribe.</p>
    <h3>Who processes it</h3><p>The payment provider (card data never reaches us), the courier (name and address) and our email provider. All within the EU or under EU standard contractual clauses.</p>
    <h3>Your rights (GDPR)</h3><p>Access, correction, deletion, portability, restriction and objection — write to privacy@naturik.studio. You can also complain to the Czech data protection authority (ÚOOÚ).</p>
    <p><b>Demo store notice:</b> on this prototype nothing you type is sent anywhere — the bag, the checkout and the newsletter all stay in your browser.</p>` },
  cookies: { t: 'Cookies', b: `
    <p>Strictly necessary storage keeps your bag and your cookie choice. Optional analytics run only after “Accept all”.</p>
    <table class="size-table"><thead><tr><th>Name</th><th>Purpose</th><th>Kept</th></tr></thead><tbody>
    <tr><td>naturik.bag.v1</td><td>Your bag contents</td><td>Until you empty it</td></tr>
    <tr><td>naturik.cookies</td><td>Your cookie choice</td><td>Until you clear it</td></tr>
    <tr><td>naturik.promo</td><td>Remembers that the 10% offer was shown</td><td>Until you clear it</td></tr>
    <tr><td>naturik.newsletter</td><td>Remembers your newsletter sign-up</td><td>Until you clear it</td></tr>
    <tr><td>Analytics</td><td>Anonymous page views — only after “Accept all”</td><td>Not active on this demo</td></tr>
    </tbody></table>
    <p>Your current choice: <b data-cookie-current></b></p>
    <div class="cookie__actions" style="max-width:420px"><button class="btn btn--ghost" type="button" data-cookie-choice="necessary"><span class="btn__label">Necessary only</span></button><button class="btn btn--dark" type="button" data-cookie-choice="all"><span class="btn__label">Accept all</span></button></div>` },
  imprint: { t: 'Imprint', b: `
    <p>NATURIK — independent outerwear studio, Prague, Czech Republic.</p><p>Company registration and VAT details: placeholder, to be completed before launch.</p><p>Contact: care@naturik.studio</p>
    <p>Campaign imagery on this prototype is placeholder material.</p>` },
  withdrawal: { t: 'Right of withdrawal', b: `
    <p>You can withdraw from your purchase within 14 days of receiving the goods without giving a reason (we extend this to 30 days). Send a clear statement to care@naturik.studio or use the return form in your parcel. We refund all payments, including standard delivery costs, without undue delay and no later than 14 days after we receive your withdrawal notice.</p>` },
};

