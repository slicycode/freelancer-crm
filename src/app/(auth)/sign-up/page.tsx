import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-6">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-primary-foreground text-sm normal-case",
              card: "bg-card text-card-foreground card-elevated",
              headerTitle: "text-headline",
              headerSubtitle: "text-body",
              socialButtonsBlockButton: "border border-border",
              formFieldLabel: "text-body",
              formFieldInput: "border-input bg-input",
              footerActionLink: "text-primary hover:text-primary/90",
            },
          }}
        />
      </div>
    </div>
  )
}