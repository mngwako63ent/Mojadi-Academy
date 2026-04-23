import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Plus, Minus, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-black/5 dark:border-white/5 last:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-bold group-hover:text-secondary transition-colors">{question}</span>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", isOpen ? "bg-secondary text-white" : "bg-black/5 dark:bg-white/5")}>
          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-primary/60 dark:text-sage leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Contact = () => {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormState({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1500);
  };

  const faqs = [
    { question: 'How do I enroll in a course?', answer: 'Simply browse our courses, select the one you\'re interested in, and click "Enroll Now". We\'ll contact you with payment details and access information.' },
    { question: 'Are the courses available online?', answer: 'Yes! All our courses are delivered online, allowing you to learn at your own pace from anywhere. You can access course materials 24/7.' },
    { question: 'Do I get a certificate after completion?', answer: 'Yes, you\'ll receive a certificate of completion for each course you finish. This certificate demonstrates your commitment to continuous learning and professional development.' },
    { question: 'What payment methods do you accept?', answer: 'We accept various payment methods including bank transfers and mobile payments. Contact us after enrollment to discuss payment options that work best for you.' },
  ];

  return (
    <div className="pt-32 pb-32 max-w-7xl mx-auto px-6">
      <div className="text-center space-y-4 mb-20">
        <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight">Contact Us</h1>
        <p className="text-primary/60 dark:text-sage max-w-2xl mx-auto">
          Have questions about our courses? Want to learn more about agricultural education? We're here to help!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-20 mb-32">
        {/* Contact Info */}
        <div className="space-y-8">
          <h2 className="text-3xl font-display font-bold">Get In Touch</h2>
          <div className="space-y-6">
            {[
              { icon: Phone, title: 'Phone', content: '086 123 4571' },
              { icon: Mail, title: 'Email', content: 'mojadiacademy@gmail.com' },
              { icon: MapPin, title: 'Location', content: 'South Africa' },
              { icon: Clock, title: 'Business Hours', content: 'Mon - Fri 08:00 AM - 5:00 PM' },
            ].map((item) => (
              <div key={item.title} className="flex gap-6 items-center glass p-6 rounded-2xl">
                <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center shrink-0">
                  <item.icon size={24} />
                </div>
                <div>
                  <h4 className="font-bold">{item.title}</h4>
                  <p className="text-primary/60 dark:text-sage">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass p-8 md:p-12 rounded-[2.5rem] space-y-8"
        >
          <h2 className="text-3xl font-display font-bold">Send Us a Message</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/40 dark:text-sage">Full Name *</label>
              <input
                required
                type="text"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-secondary transition-all"
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/40 dark:text-sage">Email Address *</label>
              <input
                required
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-secondary transition-all"
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/40 dark:text-sage">Phone Number</label>
              <input
                type="tel"
                className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-secondary transition-all"
                placeholder="Your phone number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/40 dark:text-sage">Subject *</label>
              <input
                required
                type="text"
                value={formState.subject}
                onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-secondary transition-all"
                placeholder="What's this about?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/40 dark:text-sage">Message *</label>
              <textarea
                required
                rows={5}
                value={formState.message}
                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-secondary transition-all resize-none"
                placeholder="Tell us more about your inquiry..."
              />
            </div>
            <button
              disabled={isSubmitting}
              className={cn(
                "w-full btn-premium flex items-center justify-center gap-2 text-white transition-all",
                isSuccess ? "bg-green-500" : "bg-primary dark:bg-sage hover:bg-accent dark:hover:bg-sage-bright"
              )}
            >
              {isSubmitting ? "Sending..." : isSuccess ? "Message Sent!" : "Send Message"}
              {!isSubmitting && !isSuccess && <Send size={18} />}
            </button>
          </form>
        </motion.div>
      </div>

      {/* FAQ */}
      <div className="text-center space-y-8">
        <h2 className="text-3xl font-display font-bold">Frequently Asked Questions</h2>
        <p className="text-primary/60 dark:text-sage">Find quick answers to common questions</p>
        <div className="glass rounded-[2.5rem] p-8 max-w-3xl mx-auto">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} {...faq} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contact;
