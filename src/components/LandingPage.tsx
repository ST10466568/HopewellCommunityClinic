import React from 'react';
import { Calendar, Users, Clock, Phone, MapPin, Mail, Stethoscope } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import Logo from './Logo';

const LandingPage: React.FC = () => {
  const services = [
    {
      title: "General Consultation",
      description: "Comprehensive health check-ups and routine medical care",
      icon: Users,
      duration: "30 min"
    },
    {
      title: "Emergency Care",
      description: "24/7 emergency medical services for urgent health issues",
      icon: Clock,
      duration: "15 min"
    },
    {
      title: "Specialist Referrals",
      description: "Expert consultations with specialized medical professionals",
      icon: Stethoscope,
      duration: "45 min"
    }
  ];

  const staff = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      specialty: "Internal Medicine",
      experience: "15 years"
    },
    {
      name: "Dr. Michael Chen",
      role: "Emergency Physician",
      specialty: "Emergency Medicine",
      experience: "12 years"
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Pediatrician",
      specialty: "Pediatrics",
      experience: "8 years"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" variant="with-text" textSize="xl" />
            <Button asChild>
              <a href="/auth">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="clinic-hero py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Your Health, Our Priority
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Providing compassionate, comprehensive healthcare services to our community 
            with state-of-the-art facilities and experienced medical professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/auth">Book Appointment</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#services">Our Services</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive healthcare services designed to meet all your medical needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="medical-card group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {service.duration}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Staff Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experienced healthcare professionals dedicated to your well-being
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((member, index) => (
              <Card key={index} className="medical-card text-center">
                <CardHeader>
                  <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-primary font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Specialty:</strong> {member.specialty}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Experience:</strong> {member.experience}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get in touch with us for appointments, questions, or emergency care
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="medical-card text-center">
              <CardHeader>
                <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Phone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">(555) 123-4567</p>
                <p className="text-sm text-muted-foreground mt-1">24/7 Emergency Line</p>
              </CardContent>
            </Card>
            
            <Card className="medical-card text-center">
              <CardHeader>
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">123 Healthcare Ave</p>
                <p className="text-muted-foreground">Medical District, MD 12345</p>
              </CardContent>
            </Card>
            
            <Card className="medical-card text-center">
              <CardHeader>
                <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">info@hopewellclinic.com</p>
                <p className="text-sm text-muted-foreground mt-1">General Inquiries</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo size="sm" variant="with-text" textSize="md" />
            <p className="text-muted-foreground text-sm">
              © 2024 Hopewell Community Clinic. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


















