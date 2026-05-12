Implementation Plan: Role-Based KYC Verification System
Goal
Implement a comprehensive, security-critical KYC verification system for GrabnGo that:

Maintains independent Customer and Owner KYC states
Triggers KYC checks only when attempting specific actions (rent products or activate listings)
Implements AI face matching with OTP fallback
Requires admin approval as final authority
Enforces strict service blocking until verification completes
Works for both mock and real accounts
User Review Required
IMPORTANT

Zero Regression Requirement: This implementation will NOT modify authentication, signup, login, or dashboard triggers. KYC is purely action-based enforcement.

IMPORTANT

AI Face Matching: The plan proposes using face-api.js (browser-based, TensorFlow.js) instead of InsightFace/ArcFace since InsightFace has no browser-compatible JavaScript package. face-api.js achieves 99.38% accuracy on LFW benchmark and can run entirely client-side.

WARNING

Live Camera Preview Requirement: The implementation will ensure the camera preview is visibly rendered and user-facing before any capture occurs. Hidden streams are not allowed.

WARNING

No Auto-Approval: AI matching returns boolean match result only. Admin must manually approve all KYC submissions.

Proposed Changes
Data Layer
[MODIFY] 
index.ts
Changes:

Add KycStatus type: 'not_submitted' | 'pending' | 'verified' | 'rejected'
Add KycDocument interface for storing driving license + live photo
Add KycSubmission interface for tracking customer/owner KYC submissions
Update 
User
 interface with:
customerKycStatus?: KycStatus
ownerKycStatus?: KycStatus
customerKycData?: KycSubmission
ownerKycData?: KycSubmission
Rationale: Dual KYC states allow users to be both customer and owner with independent verification requirements.

[MODIFY] 
database.ts
Changes:

Add getAllKycSubmissions() - fetch all KYC submissions for admin review
Add getKycSubmissionById() - fetch specific KYC submission by ID
Add updateKycStatus() - update user's KYC status (customer or owner specific)
Ensure 
updateUser()
 can handle KYC field updates
[NEW] 
kyc.ts
Purpose: Central service for all KYC operations

Functions:

submitCustomerKyc(userId, drivingLicense, livePhoto) - submit customer KYC
submitOwnerKyc(userId, drivingLicense, livePhoto) - submit owner KYC
performAIFaceMatch(dlImage, livePhoto) - run face-api.js matching
sendKycOtp(userPhone) - trigger OTP fallback
verifyKycOtp(userId, otpCode) - verify OTP code
checkCustomerKycStatus(userId) - check if customer can rent
checkOwnerKycStatus(userId) - check if owner can list products
[NEW] 
otp.ts
Purpose: OTP generation and verification (demo mode)

Functions:

generateOtp() - generate 6-digit OTP
storeOtp(phone, otp) - store in localStorage with expiry
verifyOtp(phone, otp) - validate against stored OTP
sendOtpSms(phone, otp) - log OTP to console (demo mode)
AI Integration
Add face-api.js Package
bash
npm install face-api.js
[NEW] 
faceMatching.ts
Purpose: AI face matching using face-api.js

Functions:

loadFaceApiModels() - load TensorFlow.js models on app init
extractFaceDescriptor(imageUrl) - extract 128D face embeddings
compareFaces(descriptor1, descriptor2) - calculate Euclidean distance
matchFaces(dlImage, livePhoto) - return { match: boolean } (threshold: 0.6)
Privacy: Face descriptors are computed in-memory only and never stored.

Frontend Components
[NEW] 
KycModal.tsx
Purpose: Base KYC modal component

Props:

isOpen: boolean
role: 'customer' | 'owner'
onClose: () => void
onSuccess: () => void
UI Flow:

Document upload step (driving license front)
Live camera preview step (visible, mandatory)
AI face matching step (shows result)
OTP fallback (if AI match fails)
Success/pending state
Key Requirements:

Camera preview must have fixed dimensions (min 400px width)
Must be visible (no display: none or visibility: hidden)
Must show live video feed before capture button is enabled
Capture requires explicit user consent button click
[NEW] 
DocumentUpload.tsx
Purpose: Driving license upload step

Features:

Drag-and-drop or file input
Image validation (format: jpg/png, max size: 5MB)
Preview before submission
Compression if > 1MB
[NEW] 
LiveCameraCapture.tsx
Purpose: Live camera preview and capture

Features:

Request camera permissions with error handling
Display live video feed in 16:9 aspect ratio container
MANDATORY: Preview must be visible at all times
Capture button only enabled when stream is active
Retake functionality
Permission help instructions (same as PhotoVerification.tsx)
Reuse: Heavily inspired by existing 
PhotoVerification.tsx
 implementation.

[NEW] 
FaceMatchResult.tsx
Purpose: Display AI matching result

Displays:

Match success: Green checkmark, "Face verified automatically"
Match failure: Amber warning, "AI match failed - OTP required"
Processing: Loading spinner
Error: Red error message with retry option
Privacy Note: Does NOT show similarity score, only boolean match result.

[NEW] 
OtpVerification.tsx
Purpose: OTP input and verification (fallback only)

Features:

6-digit OTP input (using input-otp package already in dependencies)
Resend OTP button (60s cooldown)
Auto-submit on completion
Clear instructions for user
Trigger Conditions (must meet one):

AI face match returns false
Face detection fails on either image
Image processing error
AI service unavailable
Service Blocking Enforcement
[MODIFY] 
BookingPage.tsx
Changes: Add KYC check before payment initialization:

typescript
// Before line 99 (handleProceedToPayment)
if (user.customerKycStatus !== 'verified') {
  setShowCustomerKycModal(true);
  toast.error('Please complete Customer KYC to rent products');
  return;
}
State:

Add const [showCustomerKycModal, setShowCustomerKycModal] = useState(false);
Render <KycModal role="customer" ... /> condionally
[MODIFY] 
OwnerDashboard.tsx
Changes: Add KYC check on "Add New Listing" button:

typescript
const handleAddListing = () => {
  if (user.ownerKycStatus !== 'verified') {
    setShowOwnerKycModal(true);
    toast.error('Please complete Owner KYC to list products');
    return;
  }
  navigate('/owner/add-product');
};
State:

Add const [showOwnerKycModal, setShowOwnerKycModal] = useState(false);
Render <KycModal role="owner" ... /> conditionally
Admin Interface
[NEW] 
CustomerKycReview.tsx
Purpose: Admin page for reviewing Customer KYC submissions

Features:

List all Customer KYC submissions (status: pending)
View driving license image
View captured live photo
AI match result indicator (for context, not binding)
Approve/Reject buttons
Rejection reason input field
Status filters (all, pending, approved, rejected)
[NEW] 
OwnerKycReview.tsx
Purpose: Admin page for reviewing Owner KYC submissions

Features: Same as CustomerKycReview but for Owner role

[MODIFY] 
AdminDashboard.tsx
Changes:

Add navigation cards for "Customer KYC Review" and "Owner KYC Review"
Add pending KYC count badges
[MODIFY] 
App.tsx
Changes: Add routes for:

/admin/kyc/customer → <CustomerKycReview />
/admin/kyc/owner → <OwnerKycReview />
Initialization
[MODIFY] 
App.tsx
Changes: Add face-api.js model loading on app mount:

typescript
useEffect(() => {
  loadFaceApiModels();
}, []);
Mock Data Updates
[MODIFY] 
mockData.ts
Changes:

Add customerKycStatus: 'not_submitted' to existing users
Add ownerKycStatus: 'not_submitted' to existing owners
Create one pre-verified mock customer for testing
Create one pre-verified mock owner for testing
Verification Plan
Automated Tests
NOTE

The existing project does not have a test framework setup. All verification will be manual browser testing.

Manual Verification
Test 1: No KYC During Signup/Login
Steps:

Clear localStorage
Navigate to customer signup page
Complete signup form
Verify user is redirected to dashboard WITHOUT KYC modal
Logout
Login again with same credentials
Verify user lands on dashboard WITHOUT KYC modal
Expected: No KYC prompts during authentication flows

Test 2: Customer KYC Trigger on Rent Attempt
Steps:

Login as customer (not verified)
Browse products and open product detail
Click "Book Now"
On booking page, fill in dates
Click "Pay via Razorpay" button
Verify KYC modal opens immediately
Verify booking page payment flow is blocked
Expected: KYC modal appears ONLY when attempting payment

Test 3: Owner KYC Trigger on Listing Attempt
Steps:

Login as owner (not verified)
Navigate to Owner Dashboard
Click "Add New Listing" button
Verify KYC modal opens immediately
Verify user cannot proceed to add product form
Expected: KYC modal appears ONLY when clicking add listing

Test 4: Live Camera Preview Visibility
Steps:

Trigger Customer KYC modal
Upload driving license
Click "Start Camera"
Grant camera permissions
CRITICAL: Verify live video feed is VISIBLE in preview area
Verify preview has fixed dimensions (not 0x0 pixels)
Inspect element to confirm no display: none CSS
Verify "Capture Photo" button is enabled
Expected: Camera preview must be clearly visible before capture

Test 5: AI Face Match - Success Path
Steps:

Start Customer KYC flow
Upload a clear driving license photo with face
Capture live photo of SAME person
Submit for AI matching
Verify processing spinner appears
Verify "Match successful" green message appears
Verify submission goes to "pending" status (admin approval required)
Verify NO auto-approval occurs
Expected: AI match returns success but admin approval still required

Test 6: AI Face Match - Failure + OTP Fallback
Steps:

Start Customer KYC flow
Upload driving license photo
Capture live photo of DIFFERENT person
Submit for AI matching
Verify "AI match failed" amber warning appears
Verify OTP input screen appears automatically
Check browser console for logged OTP code
Enter correct OTP
Verify submission goes to "pending" status
Expected: OTP fallback triggers ONLY when AI match fails

Test 7: Service Blocking Enforcement
Steps:

Attempt to rent product as unverified customer
Complete KYC submission (status: pending)
Attempt to rent again
Verify still blocked with "Pending approval" message
Login as admin
Approve customer KYC
Return to customer account
Verify can now proceed with rental payment
Expected: Service blocked until admin explicitly approves

Test 8: Dual-Role Independent KYC
Steps:

Create user with dual roles (customer + owner)
Complete Customer KYC and get approved
Verify can rent products
Attempt to add listing as owner
Verify Owner KYC modal appears (independent from Customer KYC)
Complete Owner KYC
Get admin approval for Owner KYC
Verify can now add listings
Verify both capabilities work independently
Expected: Customer KYC ≠ Owner KYC, each verified separately

Test 9: Admin Review Interface
Steps:

Login as admin
Navigate to "Customer KYC Review" page
Verify list shows pending Customer KYC submissions
Open a submission
Verify can view driving license image
Verify can view live photo
Verify can see AI match result (advisory only)
Click "Approve"
Verify status changes to "verified"
Repeat for Owner KYC Review page
Test reject with reason
Expected: Admin can review and approve/reject independently for each role

Test 10: Works for Mock and Real Accounts
Steps:

Test KYC flow with pre-existing mock accounts
Test KYC flow with newly created accounts
Verify both trigger KYC checks correctly
Verify both can complete KYC submission
Verify admin can review both types
Expected: No difference in behavior between mock and real accounts

Implementation Order
Phase 1: Data layer (types, database, services)
Phase 2: AI integration (face-api.js, face matching service)
Phase 3: Frontend components (KYC modal, camera, OTP)
Phase 4: Service blocking (booking page, owner dashboard)
Phase 5: Admin interface (review pages, routes)
Phase 6: Testing and verification (all manual tests above)
Dependencies
New npm packages:

face-api.js - AI face matching
Existing packages (already installed):

input-otp - OTP input UI
react-router - routing
sonner - toasts
All Radix UI components
Estimated Timeline
Planning: Complete (awaiting approval)
Implementation: ~6-8 hours
Testing: ~2-3 hours
Total: ~8-11 hours

Comment
Ctrl+Alt+M
