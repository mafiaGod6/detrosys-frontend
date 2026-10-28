import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";

import { HomePage } from "../pages/public/HomePage";
import { FAQPage } from "../pages/public/FAQPage";
import { ContactPage } from "../pages/public/ContactPage";
import { SignupPage } from "../pages/public/SignupPage";
import { LoginPage } from "../pages/public/LoginPage";
import { PricingPage } from "../pages/public/PricingPage";
import { VerifyEmailPage } from "../pages/public/VerifyEmailPage";
import { VerificationSuccessPage } from "../pages/public/VerificationSuccessPage";
import { ForgotPasswordPage } from "../pages/public/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/public/ResetPasswordPage";
import { PrivacyPage } from "../pages/public/PrivacyPage";
import { TermsPage } from "../pages/public/TermsPage";
import { RefundPage } from "../pages/public/RefundPage";

import { OnboardingPage } from "../pages/private/OnboardingPage";
import { DashboardPage } from "../pages/private/DashboardPage";
import { CampaignsPage } from "../pages/private/CampaignsPage";
import { AudiencesPage } from "../pages/private/AudiencesPage";
import { BillingPage } from "../pages/private/BillingPage";

import { EmailTemplatesPage } from "../pages/private/EmailTemplatesPage";
import { SmsTemplatesPage } from "../pages/private/SmsTemplatesPage";
import { TemplateLibraryPage } from "../pages/private/TemplateLibraryPage";
import { CreateEmailTemplatePage } from "../pages/private/CreateEmailTemplatePage";
import { CreateSmsTemplatePage } from "../pages/private/CreateSmsTemplatePage";

import { AutomationLibraryPage } from "../pages/private/AutomationLibraryPage";
import { AutomationBuilderPage } from "../pages/private/AutomationBuilderPage";

import { SettingsProfilePage } from "../pages/private/SettingsProfilePage";
import { SettingsIntegrationsPage } from "../pages/private/SettingsIntegrationsPage";
import { SettingsBillingPage } from "../pages/private/SettingsBillingPage";
import { SettingsAccountPage } from "../pages/private/SettingsAccountPage";


import { PrivateAppShell } from "../components/private/PrivateAppShell";
import { ProtectedRoute } from "../components/private/ProtectedRoute";
import { NavigationPacer } from "../components/NavigationPacer";

import { MessagingPage } from "../pages/private/MessagingPage";
import { InboxPage } from "../pages/private/InboxPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <NavigationPacer>
        <Routes>
          {/* PUBLIC & LEGAL */}
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/verification-success"
            element={<VerificationSuccessPage />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/refund" element={<RefundPage />} />

          {/* ONBOARDING */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute onboardingRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* PRIVATE APP */}
          <Route
            path="/app"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <DashboardPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/campaigns"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <CampaignsPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/audiences"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <AudiencesPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          {/* BILLING ALIAS & ROUTE */}
          <Route
            path="/billing"
            element={<Navigate to="/app/billing" replace />}
          />

          <Route
            path="/app/billing"
            element={
              <ProtectedRoute requireOnboarding>
                <BillingPage />
              </ProtectedRoute>
            }
          />

          {/* TEMPLATES (Redirects directly to Template Library) */}
          <Route
            path="/app/templates"
            element={
              <ProtectedRoute requireOnboarding>
                <Navigate to="/app/templates/library" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/templates/email"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <EmailTemplatesPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/templates/sms"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <SmsTemplatesPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/templates/library"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <TemplateLibraryPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/templates/email/create"
            element={
              <ProtectedRoute requireOnboarding>
                <CreateEmailTemplatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/templates/sms/create"
            element={
              <ProtectedRoute requireOnboarding>
                <CreateSmsTemplatePage />
              </ProtectedRoute>
            }
          />

          {/* AUTOMATIONS */}
          <Route
            path="/app/automations"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <AutomationLibraryPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/automations/create"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <AutomationBuilderPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/automations/:automationId"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <AutomationBuilderPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          {/* SETTINGS */}
          <Route
            path="/app/settings"
            element={
              <ProtectedRoute requireOnboarding>
                <Navigate
                  to="/app/settings/profile"
                  replace
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/settings/profile"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <SettingsProfilePage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/settings/integrations"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <SettingsIntegrationsPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/settings/billing"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <SettingsBillingPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/settings/account"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <SettingsAccountPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          {/* MESSAGING & INBOX */}
          <Route
            path="/app/messaging"
            element={
              <ProtectedRoute requireOnboarding>
                <PrivateAppShell>
                  <MessagingPage />
                </PrivateAppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/messaging/:campaignId"
            element={
              <ProtectedRoute requireOnboarding>
                <InboxPage />
              </ProtectedRoute>
            }
          />

          
        </Routes>
      </NavigationPacer>
    </BrowserRouter>
  );
}