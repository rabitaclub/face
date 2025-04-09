import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

interface StepProps {
  number: number;
  title: string;
  description: string;
}

const Step = ({ number, title, description }: StepProps) => (
  <motion.div 
    className="text-center"
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-2xl font-bold text-black">{number}</span>
    </div>
    <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </motion.div>
);

export const HowItWorksSection = () => {
  const steps = [
    {
      number: 1,
      title: "connect wallet",
      description: "connect & switch network to bsc"
    },
    {
      number: 2,
      title: "select kol",
      description: "search & select the kol profile"
    },
    {
      number: 3,
      title: "send message",
      description: "pay and send your message"
    },
    {
      number: 4,
      title: "get response",
      description: "receive verified kol response"
    }
  ];

  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4 text-white">how <span className="text-primary">it </span> works</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            simple, secure, and efficient process for connecting with kols
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Step
              key={index}
              number={step.number}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}; 