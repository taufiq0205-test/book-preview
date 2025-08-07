import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white font-sans">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-2">preview test</h1>
        <p className="text-lg text-gray-400">Choose an orientation to begin</p>
      </header>

      <main className="flex flex-col md:flex-row gap-8">
        <Link href="/upload?orientation=landscape" passHref>
          <div className="bg-gray-800 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-2 cursor-pointer">
            <Image
              src="https://placehold.co/600x400/2d3748/ffffff?text=Landscape"
              alt="Landscape photobook"
              className="rounded-t-lg"
              width={600}
              height={400}
            />
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-2">Landscape</h2>
              <p className="text-gray-400">A classic wide format, perfect for scenic shots.</p>
            </div>
          </div>
        </Link>

        <Link href="/upload?orientation=square" passHref>
          <div className="bg-gray-800 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-2 cursor-pointer">
            <Image
              src="https://placehold.co/500x500/2d3748/ffffff?text=Square"
              alt="Square photobook"
              className="rounded-t-lg"
              width={500}
              height={500}
            />
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-2">Square</h2>
              <p className="text-gray-400">A modern, stylish format, great for portraits.</p>
            </div>
          </div>
        </Link>
      </main>
    </div>
  );
}
