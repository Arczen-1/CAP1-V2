# System Test Flow

This guide is for end-to-end manual testing of the event flow:

`Menu Tasting Booking -> Menu Tasting Detail -> Create Contract -> Contract Detail -> Department Handoff`

## Test Scope

Use this test process to verify:

- sales can book a menu tasting
- a contract can be created from the tasting flow
- contract data is carried over correctly
- menu, pricing, and inventory selections save correctly
- inventory previews appear in contract detail
- only `sales` and `admin` can create contracts
- accounting and other departments see the correct next-step data

## Recommended Test Accounts

Prepare at least these users:

- `sales`
- `admin`
- `accounting`
- `logistics`
- `creative`
- `linen`

## Recommended Test Data

Use one complete sample booking:

- client name: `QA Test Client`
- client email: any working unique test email
- client phone: valid mobile number
- event type: `wedding`
- tasting date: future date
- event date: future date at least 2 months out
- guests: `120`

Make sure inventory exists for:

- at least 2 creative items with images
- at least 2 linen items with images
- at least 2 stockroom items with images

## Before Testing

1. Start frontend and backend.
2. Make sure MongoDB is connected.
3. If demo inventory is missing, run the seed process.
4. Log in with the `sales` account first.

## Main Happy Path

### 1. Create A Menu Tasting Booking

Steps:

1. Go to `Menu Tastings`.
2. Click `New Menu Tasting`.
3. Fill all required fields.
4. Save the booking.

Expected:

- booking is created successfully
- booking appears in the menu tasting list
- detail page opens without errors
- saved client info is correct

### 2. Open The Menu Tasting And Create A Contract

Steps:

1. Open the newly created tasting record.
2. Click the action that creates a contract from the tasting.

Expected:

- contract form opens
- tasting client data is prefilled
- event type, contact details, and guest info are carried over correctly

### 3. Build The Contract

Steps:

1. Select a package.
2. Select menu items.
3. Add at least:
   - 1 creative item
   - 1 linen item
   - 1 stockroom item
4. For each added item, confirm the thumbnail is shown.
5. Click each thumbnail and confirm enlargement works.
6. Save the contract.

Expected:

- contract saves successfully
- peso formatting is used in pricing
- stockroom is not mixed into menu pricing
- summary includes creative, linen, and stockroom selections
- no permission error appears for a valid `sales` or `admin` user

### 4. Verify Contract List And Contract Detail

Steps:

1. Go to `Contracts`.
2. Open the contract you just created.
3. Review all tabs.

Expected:

- contract appears in the list
- `View Details` opens correctly
- `Details` tab shows client and venue info
- `Menu` tab shows saved menu selections
- `Inventory` tab shows:
  - creative items
  - linen items
  - stockroom items
- inventory cards show the correct item names and quantities
- saved images can be enlarged
- `Logistics` tab shows stockroom/equipment records

### 5. Export The Contract PDF

Steps:

1. From `Contract Detail`, click `Export PDF`.
2. Let the browser open the print/export preview.

Expected:

- export opens without crashing
- contract details are visible in the preview
- menu details appear
- totals appear correctly
- PDF can be saved from the browser

### 6. Submit The Contract

Steps:

1. While logged in as `sales`, open the draft contract.
2. Click `Submit`.

Expected:

- contract status changes from `draft` to `submitted`
- progress updates
- contract still appears in the contracts list

### 7. Accounting Review

Steps:

1. Log out.
2. Log in as `accounting`.
3. Open the submitted contract.
4. Add a payment.
5. Approve the contract if that is part of the test.

Expected:

- accounting can view submitted contracts
- payment is saved
- payment totals update correctly
- approval changes status as expected

### 8. Operations Visibility

Steps:

1. Log in as `logistics`.
2. Open the approved or submitted contract as applicable.
3. Confirm stockroom/equipment details are visible.
4. Log in as `creative`.
5. Confirm creative items are visible.
6. Log in as `linen`.
7. Confirm linen items are visible.

Expected:

- each department can view the relevant contract stage
- inventory references for their department are visible
- images and item details match what sales selected

## Permissions And Negative Tests

### 9. Contract Creation Permission

Test with these users:

- `sales`
- `admin`
- `accounting`
- `logistics`
- `creative`
- `linen`

Expected:

- `sales` can open `/contracts/new`
- `admin` can open `/contracts/new`
- non-sales roles cannot create contracts
- non-sales roles should not see the `New Contract` button
- if a non-sales role manually visits `/contracts/new`, they should be redirected

### 10. Inventory Read Access In Contract Form

Steps:

1. Log in as `sales`.
2. Open contract creation.
3. Search creative items.
4. Search linen items.
5. Search stockroom items.

Expected:

- no `Access denied: insufficient permissions` error
- dropdown search returns items
- selected items load into the form correctly

### 11. Validation Checks

Verify these fail safely:

- missing celebrator name
- invalid client email
- invalid address format
- no event date
- no package selected
- invalid quantities

Expected:

- form stays on page
- error message is shown
- invalid contract is not created

## Regression Checks

Run these after every major contract-related change:

1. create menu tasting
2. create contract from tasting
3. add creative item with image
4. add linen item with image
5. add stockroom item with image
6. save contract
7. open inventory tab in contract detail
8. export PDF
9. submit contract
10. add payment

## Pass Criteria

The flow passes if:

- no unexpected permission errors appear
- data from tasting to contract is correct
- pricing and summary values are correct
- inventory image previews are retained in the contract
- contract detail shows inventory correctly
- role restrictions behave as intended

## Suggested Bug Log Format

When you find an issue, record:

- date tested
- account role used
- page or module
- exact steps
- expected result
- actual result
- screenshot
- severity
