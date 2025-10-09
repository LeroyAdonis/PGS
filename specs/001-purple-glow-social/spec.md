# Feature Specification: Purple Glow Social - AI Social Media Manager

**Feature Branch**: `001-purple-glow-social`  
**Created**: October 8, 2025  
**Status**: Draft  
**Input**: User description: "Purple Glow Social - AI Social Media Manager"

## Clarifications

### Session 2025-10-08

- Q: Content Lifecycle States & Workflow - Which content lifecycle model should the system implement? → A: Confidence Score & Automation: A system to transition from manual to automatic approval. Phase 1 (Learning): All generated posts initially require manual user approval. The AI learns from any user edits to improve its output (recursive self-improvement). Phase 2 (Autonomous): As the AI's "Confidence Score" for the business increases (based on fewer edits over time), the user is prompted to enable full automation, where posts are scheduled and published without manual review. The user can toggle this setting at any time.
- Q: AI Service Provider & Rate Limits - Which AI services will be used and how will rate limiting be handled? → A: Primary AI Provider: Google Gemini APIs. Specifically, Gemini for text generation and the gemini-2.5-flash-image-preview model (also known as Nano Banana) for all image generation and editing tasks.
- Q: Subscription Tier Content Limits - What are the content generation limits per tier? → A: Starter: 10 posts/month, Growth: 50 posts/month, Enterprise: unlimited
- Q: OAuth Token Expiration & Renewal - What should the system do when OAuth tokens expire or are revoked? → A: Immediately notify user via push notification and email, disable only affected platform, continue other platforms
- Q: Performance & Response Time Expectations - What are the acceptable response time expectations for generating content? → A: Text generation: <3 seconds, Image generation: <10 seconds, show loading states for anything longer

## User Scenarios & Testing _(mandatory)_

### User Story 1 - SMB Owner Onboarding and Business Profile Creation (Priority: P1)

As a busy service-based SMB owner, I want to quickly onboard onto the platform and set up my business profile, so that the AI can understand my business context and start generating relevant content for my social media accounts.

**Why this priority**: This is foundational for the service as it captures essential business information required for relevant content generation. Without proper business context, the AI cannot generate appropriate content.

**Independent Test**: Can be fully tested by walking through the onboarding flow and verifying that the business profile is created with all necessary information stored correctly. This delivers immediate value as users can see their business information properly represented in the system.

**Acceptance Scenarios**:

1. **Given** a new SMB owner with valid credentials, **When** they complete the sign-up process, **Then** they should be directed to the onboarding wizard
2. **Given** a user in the onboarding wizard, **When** they input all required business information and submit, **Then** a complete business profile should be created and stored
3. **Given** a user who has entered business information, **When** they upload their logo and select brand colors, **Then** these assets should be properly stored and associated with their account
4. **Given** a user who has completed the onboarding wizard, **When** they link their social media accounts, **Then** the accounts should be successfully connected with proper OAuth permissions

---

### User Story 2 - AI Content Generation and Approval (Priority: P1)

As an SMB owner, I want the AI to generate culturally relevant content in my chosen language and tone, which I can review and approve before publishing, so that my social media maintains a consistent brand voice while requiring minimal effort from me.

**Why this priority**: This represents the core value proposition of the platform - reducing the time SMB owners spend on social media management while ensuring relevant, high-quality content.

**Independent Test**: Can be tested by verifying that the AI generates content based on business profile information and that users can review, edit, and approve this content. This delivers the primary value of saving time while maintaining brand control.

**Acceptance Scenarios**:

1. **Given** a user has completed onboarding, **When** they access the dashboard for the first time, **Then** they should see AI-generated content ready for approval based on their subscription tier
2. **Given** a user viewing generated content, **When** they approve a post, **Then** it should be scheduled according to the optimal posting time
3. **Given** a user viewing generated content, **When** they edit a post and approve it, **Then** the AI should learn from these edits to improve future content
4. **Given** a user who selects a specific language and tone, **When** content is generated, **Then** it should reflect the selected language and incorporate appropriate cultural references

---

### User Story 3 - Automated Posting and Confidence Score (Priority: P2)

As an SMB owner who consistently uses the platform, I want the system to learn from my preferences and eventually post automatically without requiring manual approval, so that social media management becomes even more hands-off over time.

**Why this priority**: This enhances the core value proposition by further reducing user effort as the system learns, but it's dependent on the initial content generation and approval flow being established first.

**Independent Test**: Can be tested by simulating user approval patterns over time and verifying that the confidence score increases appropriately, eventually enabling automatic posting. This delivers increased value through time-saving automation.

**Acceptance Scenarios**:

1. **Given** a user who regularly approves posts without edits, **When** the AI's confidence score reaches the threshold, **Then** the user should be prompted to enable automatic posting
2. **Given** a user who has enabled automatic posting, **When** new content is generated, **Then** it should be automatically scheduled without requiring manual approval
3. **Given** a user with automatic posting enabled, **When** they want to regain manual control, **Then** they should be able to toggle the automation setting off

---

### User Story 4 - AI Image Generation and Brand Integration (Priority: P2)

As an SMB owner, I want the platform to automatically generate visually appealing images that incorporate my brand elements for social media posts, so that my content stands out and maintains brand consistency.

**Why this priority**: Visual content significantly increases engagement on social media platforms, making this an important but not critical feature compared to text content generation.

**Independent Test**: Can be tested by verifying that the system generates images incorporating user-provided brand elements and that these images can be included in social media posts. This delivers value through enhanced visual presence without graphic design effort.

**Acceptance Scenarios**:

1. **Given** a user with a complete brand profile including logo and colors, **When** a post requiring an image is generated, **Then** the system should create a relevant image incorporating brand elements
2. **Given** a generated image, **When** the user approves it, **Then** it should be attached to the corresponding social media post
3. **Given** a generated image, **When** the user rejects it, **Then** the system should generate an alternative image or allow the user to upload their own

---

### User Story 5 - Subscription Management and Billing (Priority: P2)

As an SMB owner, I want to easily manage my subscription tier, billing information, and payment methods, so that I can control costs and adjust services as my business needs change.

**Why this priority**: While essential for business operations, this is not part of the core value proposition but necessary for sustainable service delivery.

**Independent Test**: Can be tested by verifying that users can view, modify, and upgrade/downgrade subscription plans with appropriate billing updates. This delivers value through flexible service management.

**Acceptance Scenarios**:

1. **Given** a user on the free trial, **When** the trial period ends, **Then** they should be automatically billed according to their selected plan
2. **Given** a user on any subscription tier, **When** they upgrade their subscription, **Then** they should immediately gain access to the new tier's features with prorated billing
3. **Given** a user who wants to downgrade, **When** they select a lower tier, **Then** the change should take effect at the end of their current billing cycle
4. **Given** a user who wishes to cancel their subscription, **When** they complete the cancellation process, **Then** their service should continue until the end of the current billing period

---

### User Story 6 - Analytics Dashboard (Priority: P3)

As an SMB owner, I want to view engagement metrics and performance analytics for my social media posts, so that I can understand what content resonates with my audience and adjust my strategy accordingly.

**Why this priority**: While valuable for optimization, this is not essential for the core function of content generation and publishing.

**Independent Test**: Can be tested by verifying that the system collects and displays relevant engagement metrics from connected social platforms. This delivers value through data-driven insights.

**Acceptance Scenarios**:

1. **Given** a user with published posts, **When** they view the analytics dashboard, **Then** they should see engagement metrics for each post across all connected platforms
2. **Given** a user viewing analytics, **When** they select a specific time period, **Then** the dashboard should update to show data for only that period
3. **Given** a user with multiple social platforms connected, **When** they filter analytics by platform, **Then** they should see metrics specific to the selected platform

---

### User Story 7 - CopilotKit Chat Assistant for Natural Language Commands (Priority: P3)

As an SMB owner, I want to use natural language commands via a chat interface to manage content and settings, so that I can quickly make changes without navigating through multiple menus.

**Why this priority**: This provides an alternative interface that enhances user experience but is not critical to core functionality.

**Independent Test**: Can be tested by verifying that the chat interface correctly interprets and executes natural language commands. This delivers value through improved efficiency and accessibility.

**Acceptance Scenarios**:

1. **Given** a user at the dashboard, **When** they type "Generate three posts about our winter special" in the chat interface, **Then** the system should create three draft posts about winter promotions
2. **Given** a user who wants to analyze performance, **When** they ask "Show me my most engaging posts from last month" in chat, **Then** the system should display relevant posts sorted by engagement
3. **Given** a user who wants to modify content tone, **When** they command "Change the tone of scheduled posts to be more humorous", **Then** the system should adjust the tone of pending posts accordingly

---

### Edge Cases

- What happens when a user's social media platform revokes OAuth access? System must immediately notify the user via push notification and email, disable posting only to the affected platform while continuing operations on other platforms, preserve scheduled posts for that platform, and provide clear re-authentication guidance.
- How does system handle content generation for niche industries with limited reference data? System should request more specific information from users and adjust confidence scores accordingly.
- What happens when a user exceeds their subscription tier's content limits? System should notify the user and provide clear upgrade options without service interruption.
- How does system handle failed image generation? System must provide alternatives or default to text-only posts with appropriate notification to users.
- What happens during service downtime or API outages? System should maintain a queue of scheduled posts and attempt to publish when service is restored.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide user authentication via email/password and social OAuth (Google, Facebook) using Supabase Auth
- **FR-002**: System MUST implement a three-tier subscription model (Starter, Growth, Enterprise) with different pricing and features
- **FR-002a**: Starter tier MUST be limited to 10 posts per month
- **FR-002b**: Growth tier MUST be limited to 50 posts per month
- **FR-002c**: Enterprise tier MUST provide unlimited post generation
- **FR-002d**: System MUST track post generation usage per user per billing cycle and enforce tier limits
- **FR-002e**: System MUST notify users when they approach (80%) and reach (100%) their tier limits
- **FR-003**: System MUST offer a 14-day free trial of the Growth tier with automatic billing via Paystack after the trial period
- **FR-004**: System MUST include a comprehensive onboarding wizard to collect business information
- **FR-005**: System MUST securely store business profile data including business details, target audience, services, and brand identity
- **FR-006**: System MUST support content tone and language selection across all 11 official South African languages
- **FR-007**: System MUST enable users to connect multiple social media accounts (Facebook, Instagram, Twitter/X, LinkedIn) via OAuth
- **FR-008**: System MUST securely store social media access tokens
- **FR-008a**: System MUST detect when OAuth tokens expire or are revoked by social media platforms
- **FR-008b**: System MUST immediately notify users via both push notification and email when token issues are detected
- **FR-008c**: System MUST disable posting only to the affected platform while continuing to operate normally for other connected platforms
- **FR-008d**: System MUST provide clear in-app guidance for users to re-authenticate the affected platform
- **FR-008e**: System MUST preserve scheduled posts for the affected platform and resume posting once re-authentication is complete
- **FR-009**: System MUST provide a visual calendar interface for managing content
- **FR-010**: System MUST generate AI content based on the user's business profile and subscription tier using Google Gemini APIs
- **FR-011**: System MUST implement a confidence scoring system to learn from user edits and improve content over time through recursive self-improvement
- **FR-011a**: System MUST track edit frequency and magnitude per business profile to calculate Confidence Score
- **FR-011b**: System MUST operate in Phase 1 (Learning Mode) by default, requiring manual approval for all generated posts
- **FR-012**: System MUST support transition from manual to automatic content approval based on confidence score
- **FR-012a**: System MUST prompt users to enable Phase 2 (Autonomous Mode) when Confidence Score reaches the defined threshold
- **FR-012b**: System MUST allow users to toggle between Phase 1 (manual approval) and Phase 2 (automatic posting) at any time
- **FR-012c**: System MUST automatically schedule and publish posts without manual review when Phase 2 is enabled
- **FR-013**: System MUST generate branded images for social media posts using Google Gemini's gemini-2.5-flash-image-preview model (Nano Banana)
- **FR-014**: System MUST incorporate user's brand elements (logo, colors) into generated images using Gemini image generation capabilities
- **FR-015**: System MUST provide a natural language chat interface for issuing commands
- **FR-016**: System MUST display basic engagement metrics (likes, comments, shares) from connected platforms
- **FR-017**: System MUST allow users to manage their subscription (upgrade/downgrade/cancel) and update billing information
- **FR-018**: System MUST provide a secure admin dashboard for platform management
- **FR-019**: System MUST display platform analytics for administrators
- **FR-020**: System MUST implement a lead insights tool for analyzing potential clients' social media presence
- **FR-021**: System MUST comply with South Africa's POPIA regulations for data privacy
- **FR-022**: System MUST present clear Terms and Conditions & Privacy Policy during user sign-up

### Key Entities _(include if feature involves data)_

- **User**: Represents an SMB owner with authentication details, subscription status, and personal information
- **Business Profile**: Contains all business-related information including name, industry, description, target audience, services, service areas, and brand identity. Includes a Confidence Score that tracks AI learning progress based on user edit patterns.
- **Social Media Account**: Represents a connected social platform with account details, access tokens, and platform-specific settings
- **Content**: Represents a social media post with text, images, scheduling information, approval status, and performance metrics. Content lifecycle states: Generated → (Manual Approval in Phase 1) → Scheduled → Published → Completed. In Phase 2 (autonomous mode), the flow becomes: Generated → Auto-Scheduled → Published → Completed (bypassing manual approval when Confidence Score threshold is met).
- **Subscription**: Represents a user's chosen service tier with features, limits, pricing, and billing information. Tiers: Starter (10 posts/month), Growth (50 posts/month), Enterprise (unlimited posts). Includes usage tracking for current billing cycle.
- **Brand Assets**: Stores visual elements including logos, color schemes, and other brand identity components

### Technical Constraints

- **TC-001**: AI text generation MUST use Google Gemini APIs
- **TC-002**: AI image generation and editing MUST use Google Gemini gemini-2.5-flash-image-preview model (Nano Banana)
- **TC-003**: System MUST implement appropriate rate limiting and error handling for Google Gemini API calls
- **TC-004**: System MUST handle Google Gemini API quota limits gracefully with user-facing notifications when limits are approached or exceeded

### Non-Functional Requirements

#### Performance

- **NFR-001**: Text content generation MUST complete within 3 seconds under normal operating conditions
- **NFR-002**: Image generation MUST complete within 10 seconds under normal operating conditions
- **NFR-003**: System MUST display loading states with progress indicators for any operation exceeding expected completion time
- **NFR-004**: System MUST provide user feedback (loading spinner, progress bar, or status message) for all AI generation operations
- **NFR-005**: Dashboard page load time MUST be under 2 seconds on standard broadband connections

#### Reliability

- **NFR-006**: System MUST maintain 99.5% successful post publishing rate across all connected platforms
- **NFR-007**: System MUST implement retry logic with exponential backoff for failed API calls to external services
- **NFR-008**: System MUST queue failed posts for retry and notify users of persistent failures after 3 retry attempts

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: SMB owners can complete the onboarding process in under 10 minutes
- **SC-002**: The system generates content that requires minimal editing (less than 20% of content requiring substantive edits)
- **SC-003**: Users save at least 5 hours per week on social media management compared to manual methods
- **SC-004**: After 1 month of use, 70% of users enable automatic content posting
- **SC-005**: Posts created by the platform achieve 30% higher engagement than the client's previous average engagement rate
- **SC-006**: 85% of users report that the content accurately reflects their brand voice and South African cultural context
- **SC-007**: Free trial conversion rate exceeds 40% across all targeted industries
- **SC-008**: Monthly subscription retention rate is maintained above 85% after 3 months
- **SC-009**: System successfully processes 99.5% of scheduled posts across all connected platforms
- **SC-010**: Admin lead insights tool accurately identifies at least 5 high-value conversion opportunities per week
