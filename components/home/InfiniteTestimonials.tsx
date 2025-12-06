'use client'

import './testimonials.css'

const testimonials = [
  {
    category: "Restaurant",
    name: "Marco Rossi",
    role: "Owner, Italian Trattoria",
    avatar: "https://i.pravatar.cc/150?img=11",
    text: "My health score was 42 when I started. The tool showed me my location tags were broken. Fixed it, and dinner reservations are up 20%."
  },
  {
    category: "Restaurant",
    name: "Sarah Jenkins",
    role: "Manager, Local Brunch Spot",
    avatar: "https://i.pravatar.cc/150?img=5",
    text: "I used the competitor analysis to see what the top brunch spots were posting. Now my Sunday content gets double the reach."
  },
  {
    category: "Nail Salon",
    name: "Jenny Tran",
    role: "Owner, Nail Art Studio",
    avatar: "https://i.pravatar.cc/150?img=9",
    text: "AccountDoctor told me my bio link was confusing clients. I used the suggested format, and booking inquiries became much smoother."
  },
  {
    category: "Nail Salon",
    name: "Lisa Wong",
    role: "Independent Nail Technician",
    avatar: "https://i.pravatar.cc/150?img=32",
    text: "The AI content fix is magic. It writes captions that actually sound like a nail artist, not a robot. Saves me so much time."
  },
  {
    category: "Hair Salon",
    name: "Mike Ross",
    role: "Barber Shop Owner",
    avatar: "https://i.pravatar.cc/150?img=53",
    text: "I didn't know using the wrong hashtags was hurting my visibility. This tool found the 'growth killers' instantly."
  },
  {
    category: "Hair Salon",
    name: "Elena Rodriguez",
    role: "Hair Color Specialist",
    avatar: "https://i.pravatar.cc/150?img=44",
    text: "Finally figured out why my 'Before & After' reels weren't getting views. The diagnosis on my posting times was spot on."
  },
  {
    category: "Beauty Spa",
    name: "Dr. Emily White",
    role: "Director, Medical Spa",
    avatar: "https://i.pravatar.cc/150?img=24",
    text: "Professional and actionable. It helped us optimize our profile grid to look more trustworthy for high-end clients."
  },
  {
    category: "Beauty Spa",
    name: "Chloe Dubois",
    role: "Esthetician & Spa Owner",
    avatar: "https://i.pravatar.cc/150?img=35",
    text: "The 'Missed Traffic Check' was an eye-opener. We were losing clicks on our special offers story highlights."
  },
  {
    category: "Bakery",
    name: "Tom Baker",
    role: "Artisan Baker",
    avatar: "https://i.pravatar.cc/150?img=13",
    text: "Photography advice was great. My bread looks delicious now, and followers are actually commenting and asking for prices."
  },
  {
    category: "Bakery",
    name: "Anita Patel",
    role: "Cupcake Shop Owner",
    avatar: "https://i.pravatar.cc/150?img=20",
    text: "I love the local competitor insights. I saw a rival bakery doing giveaways and realized I needed to step up my game."
  },
  {
    category: "Coffee Shop",
    name: "Jack O'Neill",
    role: "Coffee Roaster",
    avatar: "https://i.pravatar.cc/150?img=60",
    text: "Traffic from Instagram to our ordering page increased by 35% after I fixed the issues flagged by the Health Score."
  },
  {
    category: "Coffee Shop",
    name: "Maya Lin",
    role: "Cafe Manager",
    avatar: "https://i.pravatar.cc/150?img=42",
    text: "Simple to use. It told me to stop using generic hashtags like #coffee and start using local neighborhood tags."
  },
  {
    category: "Bar",
    name: "Sam Malone",
    role: "Pub Owner",
    avatar: "https://i.pravatar.cc/150?img=68",
    text: "We were posting at the wrong times. The tool analyzed our audience and told us to post at 5 PM. Happy hour is busier now."
  },
  {
    category: "Bar",
    name: "Alex Rivera",
    role: "Rooftop Bar Manager",
    avatar: "https://i.pravatar.cc/150?img=12",
    text: "The AI suggested captions for our cocktail photos that are witty and fun. Perfect for our brand voice."
  },
  {
    category: "Gym",
    name: "Coach David",
    role: "Gym Owner",
    avatar: "https://i.pravatar.cc/150?img=3",
    text: "Competitor analysis showed other gyms were using Reels more effectively. I followed the guide and engagement tripled."
  },
  {
    category: "Gym",
    name: "Tara Fit",
    role: "Pilates Instructor",
    avatar: "https://i.pravatar.cc/150?img=49",
    text: "My bio was a mess. AccountDoctor helped me structure it so new students know exactly how to sign up for a trial."
  },
  {
    category: "Pet Grooming",
    name: "Jessica Paws",
    role: "Dog Groomer",
    avatar: "https://i.pravatar.cc/150?img=28",
    text: "I got a health score of 60 initially. I followed the 'Instant Content Fix' plan, and now I'm fully booked for next week."
  },
  {
    category: "Pet Grooming",
    name: "Rob Bark",
    role: "Mobile Pet Grooming Owner",
    avatar: "https://i.pravatar.cc/150?img=59",
    text: "It found a hidden growth killer: my contact button wasn't set up correctly for mobile users. Such a simple fix!"
  },
  {
    category: "Florist",
    name: "Rose Field",
    role: "Wedding Florist",
    avatar: "https://i.pravatar.cc/150?img=41",
    text: "The aesthetic check is great. It helped me curate a feed that looks like a portfolio, attracting more wedding clients."
  },
  {
    category: "Florist",
    name: "Ken Flora",
    role: "Plant Shop Owner",
    avatar: "https://i.pravatar.cc/150?img=55",
    text: "I use the AI to generate captions for my plant care tips. It saves me hours of writing every week."
  },
  {
    category: "Tattoo",
    name: "Jay Inks",
    role: "Tattoo Artist",
    avatar: "https://i.pravatar.cc/150?img=8",
    text: "My work is visual, but my account wasn't growing. The tool showed me I wasn't engaging enough with local followers."
  },
  {
    category: "Tattoo",
    name: "Kat V.",
    role: "Tattoo Studio Owner",
    avatar: "https://i.pravatar.cc/150?img=47",
    text: "Insights are better than Instagram's own analytics. I know exactly which tattoo styles are getting the most shares locally."
  },
  {
    category: "Boutique",
    name: "Sophie Style",
    role: "Fashion Boutique Owner",
    avatar: "https://i.pravatar.cc/150?img=16",
    text: "Found out my 'Shop Now' link was broken on Android devices. I can't believe how many sales I might have missed!"
  },
  {
    category: "Boutique",
    name: "Emma Ward",
    role: "Vintage Store Manager",
    avatar: "https://i.pravatar.cc/150?img=29",
    text: "Beat Local Competitors feature is gold. I can see what sales the boutique down the street is running and adjust my strategy."
  }
]

export function InfiniteTestimonials() {
  const row1 = testimonials.slice(0, 12)
  const row2 = testimonials.slice(12, 24)

  return (
    <section className="w-full bg-gray-50 py-8 overflow-hidden flex-[1] min-h-[30vh]">
      <div className="max-w-6xl mx-auto px-8 mb-6">
        <div className="text-center">
          <p className="font-sans text-xs text-gray-500 mb-2 uppercase tracking-wider">TESTIMONIALS</p>
          <h2 className="font-serif text-4xl font-bold text-gray-900">What Local Business Owners Say</h2>
        </div>
      </div>

      {/* 第一排：从右向左滚动 */}
      <div className="testimonial-row-container mb-8">
        <div className="testimonial-track">
          {[...row1, ...row1].map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full flex-shrink-0 ring-2 ring-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-base font-bold text-gray-900">{testimonial.name}</p>
                  <p className="font-sans text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
              <p className="font-sans text-sm text-gray-600 leading-relaxed">
                {testimonial.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 第二排：从左向右滚动（速度稍慢） */}
      <div className="testimonial-row-container">
        <div className="testimonial-track testimonial-track-reverse">
          {[...row2, ...row2].map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full flex-shrink-0 ring-2 ring-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-base font-bold text-gray-900">{testimonial.name}</p>
                  <p className="font-sans text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
              <p className="font-sans text-sm text-gray-600 leading-relaxed">
                {testimonial.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
