import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="py-12 bg-background-dark text-gray-400 rounded-b-lg shadow-lg">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-center items-center text-center">
          <div className="mb-8 md:mb-0 text-center">
            <Image src="/logo.svg" alt="Rabita Logo" width={300} height={300} />
          </div>
        </div>
      </div>
    </footer>
  );
}; 