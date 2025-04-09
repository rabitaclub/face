import Image from "next/image";
import Link from "next/link";
import { FaXTwitter, FaGithub } from "react-icons/fa6";
import appConfig from "@/config/app.config.json";

export const Footer = () => {
  return (
    <footer className="py-12 bg-background-dark text-gray-400 rounded-b-lg shadow-lg">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-center items-center text-center">
          <div className="mb-8 md:mb-0 text-center">
            <Image src="/logo.svg" alt="Rabita Logo" width={300} height={300} />
            
            <div className="flex justify-center space-x-6 mt-6">
              <Link href={appConfig.socials.x} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <FaXTwitter size={24} />
                <span className="sr-only">X</span>
              </Link>
              <Link href={appConfig.socials.github} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <FaGithub size={24} />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8 text-sm">
          <p>Buidl by <Link href={appConfig.authors[0].url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {appConfig.authors.map(author => author.name).join(', ')}
          </Link></p>
        </div>
      </div>
    </footer>
  );
}; 