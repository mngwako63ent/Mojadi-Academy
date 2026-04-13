import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Target, History, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="pt-32 pb-32 space-y-32">
      {/* Story Section */}
      <section className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <span className="text-secondary dark:text-[#E6B981] font-bold uppercase tracking-widest text-sm">Our Story</span>
          <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight">
            Cultivating Knowledge for a <span className="text-secondary dark:text-[#E6B981]">Sustainable</span> Future
          </h1>
          <p className="text-lg text-primary/70 dark:text-sage leading-relaxed">
            Founded in 2015, Mojadi Academy began with a simple mission: to bridge the gap between traditional farming wisdom and modern agricultural science. We believe that every farmer, regardless of scale, deserves access to world-class education.
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-secondary/10 text-secondary dark:text-[#E6B981] rounded-xl flex items-center justify-center">
                <Target size={24} />
              </div>
              <h4 className="font-bold">Our Mission</h4>
              <p className="text-sm text-primary/60 dark:text-sage">To empower farmers with the tools and knowledge to thrive in a changing climate.</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 text-primary dark:text-sage rounded-xl flex items-center justify-center">
                <History size={24} />
              </div>
              <h4 className="font-bold">Our Vision</h4>
              <p className="text-sm text-primary/60 dark:text-sage">A world where sustainable agriculture is the standard, not the exception.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-secondary/20 blur-3xl rounded-full" />
          <div className="relative rounded-[3rem] overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1686008673889-1817ec20e302?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="About AgriAcademy"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
      </section>

      {/* Values Section */}
      <section className="bg-primary py-32">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-20">
          <div className="space-y-4">
            <span className="text-secondary dark:text-[#E6B981] font-bold uppercase tracking-widest text-sm">Our Values</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white">What Drives Us</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Integrity', desc: 'We provide honest, scientifically-backed information that farmers can trust.', icon: Award },
              { title: 'Sustainability', desc: 'Every lesson is designed with the long-term health of our planet in mind.', icon: Leaf },
              { title: 'Community', desc: 'We foster a global network of farmers who learn and grow together.', icon: Target },
            ].map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="w-20 h-20 bg-white/10 text-secondary dark:text-[#E6B981] rounded-3xl flex items-center justify-center mx-auto border border-white/10">
                  <v.icon size={40} />
                </div>
                <h3 className="text-2xl font-display font-bold text-white">{v.title}</h3>
                <p className="text-white/80 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
