import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-ink text-paper/70 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="font-display text-xl font-semibold text-paper">
            TALAMITA<span className="text-pink">.</span>
          </p>
          <p className="text-sm mt-3 leading-relaxed">
            Everything, everyday — fashion, beauty, home and tech, matched to you by an AI
            shopping assistant.
          </p>
        </div>

        <div>
          <h3 className="text-paper text-xs font-semibold uppercase tracking-wider mb-4">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/products" className="hover:text-pink transition-colors">
                All products
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-pink transition-colors">
                Cart
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-pink transition-colors">
                Order tracking
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-paper text-xs font-semibold uppercase tracking-wider mb-4">Account</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/login" className="hover:text-pink transition-colors">
                Log in
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-pink transition-colors">
                Create account
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-paper text-xs font-semibold uppercase tracking-wider mb-4">Powered by</h3>
          <ul className="space-y-2 text-sm">
            <li>AI recommendations &amp; chat — OpenClaw</li>
            <li>Order &amp; inventory automation — n8n</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="max-w-6xl mx-auto px-6 py-5 text-xs flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} TALAMITA. All rights reserved.</span>
          <span>AI styling by OpenClaw · automated by n8n</span>
        </div>
      </div>
    </footer>
  );
}
