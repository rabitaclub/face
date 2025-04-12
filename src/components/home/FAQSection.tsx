import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

const FAQCard = ({ item, index }: { item: FAQItem; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-background-light border border-border rounded-lg p-4 mb-4"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left"
      >
        <h3 className="text-lg font-medium text-white">{item.question}</h3>
        <svg
          className={`w-5 h-5 text-primary transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 text-gray-300"
        >
          <p>{item.answer}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export const FAQSection = () => {
  const userFAQs: FAQItem[] = [
    {
      question: "What is the platform fee?",
      answer: "The platform fee is 7% of the total message cost. This fee helps maintain and improve the rabita platform."
    },
    {
      question: "What if the KOL doesn't respond to my message?",
      answer: "If a KOL doesn't respond to your message within 7 days, you'll automatically receive a 45% refund of your payment. The refund process is handled by our smart contract system."
    },
    {
      question: "How do I send a message to a KOL?",
      answer: "Connect your wallet, select the KOL you want to message, compose your message, pay the required fee, and send. Your message will be encrypted and only visible to you and the KOL."
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, rabita uses end-to-end encryption to ensure only you and the KOL can read your messages. Your conversations are completely private and secured by blockchain technology."
    }
  ];

  const kolFAQs: FAQItem[] = [
    {
      question: "How do I set my availability?",
      answer: "As a KOL, you can set your availability days and times in your profile settings. This helps manage user expectations about when they might receive a response."
    },
    {
      question: "How much do I earn per message?",
      answer: "You earn 93% of the message fee set on your profile. The platform only takes a 7% fee to maintain the service."
    },
    {
      question: "What happens if I don't respond to a message?",
      answer: "If you don't respond to a message within 7 days, the user will receive a 45% refund. The remaining amount is split between you and the platform according to the standard fee structure."
    },
    {
      question: "How do I withdraw my earnings?",
      answer: "Your earnings are automatically deposited to your connected wallet. You can see your earnings history and details in your profile dashboard."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.section
      id="faq"
      className="py-12"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4 text-white">
            frequently asked <span className="text-primary">questions</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            everything you need to know about using rabita
          </p>
        </motion.div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full flex justify-center mb-8 text-white">
            <TabsTrigger value="users" className="flex-1 max-w-xs">
              for users
            </TabsTrigger>
            <TabsTrigger value="kols" className="flex-1 max-w-xs">
              for kols
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            <div className="grid gap-4">
              {userFAQs.map((faq, index) => (
                <FAQCard key={index} item={faq} index={index} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="kols" className="space-y-4">
            <div className="grid gap-4">
              {kolFAQs.map((faq, index) => (
                <FAQCard key={index} item={faq} index={index} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.section>
  );
}; 