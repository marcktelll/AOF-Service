import Image from "next/image";

export default function ComingSoon() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center p-6">
            <Image src="/logo.png" alt="Logo" width={200} height={200} className="mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Coming Soon</h1>
            <p className="text-lg md:text-xl">Our app is being rebuilt. Stay tuned!</p>
        </div>
    );
}
