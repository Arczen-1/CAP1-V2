# UAT Test Cases

Use this sheet for structured user acceptance testing of the main system flow:

`Menu Tasting Booking -> Menu Tasting Detail -> Create Contract -> Contract Detail -> Submit / Approve`

## Status Guide

- `Not Run`
- `Pass`
- `Fail`
- `Blocked`

## Suggested Test Data

- client name: `QA Test Client`
- client email: unique test email each run
- client phone: valid mobile number
- event type: `wedding`
- expected guests: `120`
- tasting date: future date
- event date: future date at least 2 months ahead

## UAT Sheet

| Test Case ID | Steps | Expected Result | Status |
|---|---|---|---|
| UAT-001 | 1. Log in as `sales`.<br>2. Open `Menu Tastings`.<br>3. Click `New Menu Tasting`.<br>4. Enter valid client, event, tasting, and pax details.<br>5. Save the booking. | Menu tasting is created successfully.<br>The record appears in the list.<br>No validation or permission error appears. | Not Run |
| UAT-002 | 1. From the `Menu Tastings` list, open the newly created booking.<br>2. Review client, event, tasting schedule, and pax details. | Menu tasting detail opens correctly.<br>All saved information matches the booking form input. | Not Run |
| UAT-003 | 1. While logged in as `sales`, try creating a menu tasting with one or more missing required fields.<br>2. Try again with an invalid email.<br>3. Try again with invalid guest count or tasting pax. | Form blocks invalid submission.<br>Clear validation errors are shown.<br>No invalid booking is saved. | Not Run |
| UAT-004 | 1. Open a valid menu tasting detail as `sales`.<br>2. Click the action to create a contract from the tasting. | Contract creation form opens successfully.<br>No permission error appears.<br>No broken route or blank screen appears. | Not Run |
| UAT-005 | 1. On the contract form opened from a tasting, review prefilled fields.<br>2. Compare against the tasting record. | Client name, contact info, email, address, event type, guest count, and preferred date are carried over correctly from the tasting. | Not Run |
| UAT-006 | 1. In the contract form, choose a package.<br>2. Select valid menu items based on package limits.<br>3. Review pricing summary. | Package selection works.<br>Menu selection limits are enforced.<br>Menu pricing is shown in pesos.<br>Summary updates correctly. | Not Run |
| UAT-007 | 1. In the contract add-ons section, click `Add Item` under creative items.<br>2. Search for a creative item in the dropdown.<br>3. Select one with an image.<br>4. Confirm the thumbnail appears on the left.<br>5. Click the thumbnail. | Creative item is added successfully.<br>Thumbnail is shown after selection.<br>Image enlargement dialog opens correctly.<br>Quantity and pricing update correctly. | Not Run |
| UAT-008 | 1. In the same contract, add a linen item using the dropdown.<br>2. Select one with an image.<br>3. Confirm thumbnail and item details appear.<br>4. Click the thumbnail. | Linen item is added successfully.<br>Thumbnail is shown after selection.<br>Image enlargement dialog opens correctly.<br>Quantity and pricing update correctly. | Not Run |
| UAT-009 | 1. In the same contract, add a stockroom item using the dropdown.<br>2. Select one with an image.<br>3. Confirm thumbnail and item details appear.<br>4. Click the thumbnail. | Stockroom item is added successfully.<br>Thumbnail is shown after selection.<br>Image enlargement dialog opens correctly.<br>Stockroom pricing is separate from menu pricing. | Not Run |
| UAT-010 | 1. Complete the contract form with menu, creative, linen, and stockroom selections.<br>2. Review the summary tab.<br>3. Save the contract. | Contract saves successfully.<br>Summary includes creative, linen, and stockroom items.<br>Stockroom items are not mixed into menu pricing.<br>All totals are formatted in pesos. | Not Run |
| UAT-011 | 1. Open the saved contract from `Contracts`.<br>2. Go to `View Details`.<br>3. Check `Details`, `Menu`, and `Inventory` tabs. | Contract detail loads correctly.<br>Menu items are visible.<br>`Inventory` tab is present and shows creative, linen, and stockroom selections for the event. | Not Run |
| UAT-012 | 1. In `Contract Detail`, open the `Inventory` tab.<br>2. Verify each saved item card.<br>3. Click each saved image preview. | Each saved item shows the correct name, quantity, and item grouping.<br>Available saved thumbnails can be enlarged.<br>No UI error occurs when opening preview images. | Not Run |
| UAT-013 | 1. From `Contract Detail`, click `Export PDF`.<br>2. Allow the print/export dialog to open.<br>3. Review the generated contract preview. | PDF export opens successfully.<br>Contract number, client details, menu details, and totals are visible.<br>No blank or broken export page appears. | Not Run |
| UAT-014 | 1. While logged in as `sales`, open a draft contract.<br>2. Click `Submit`. | Contract status changes from `draft` to `submitted`.<br>Progress updates.<br>Contract remains visible in the contracts list. | Not Run |
| UAT-015 | 1. Log out from `sales`.<br>2. Log in as `accounting`.<br>3. Open the submitted contract.<br>4. Add a payment.<br>5. Approve the contract if applicable. | Accounting can view the submitted contract.<br>Payment is saved successfully.<br>Payment totals and payment status update correctly.<br>Approval changes status as expected. | Not Run |
| UAT-016 | 1. Log in as `logistics`.<br>2. Open the submitted or approved contract.<br>3. Review logistics/equipment information.<br>4. Log in as `creative` and review creative selections.<br>5. Log in as `linen` and review linen selections. | Each department can view the contract stage relevant to them.<br>Selected inventory references are visible in the contract detail flow. | Not Run |
| UAT-017 | 1. Log in as `admin`.<br>2. Open `/contracts/new` from the UI.<br>3. Create a contract manually.<br>4. Save the contract. | `admin` can access and create contracts successfully.<br>No permission error appears. | Not Run |
| UAT-018 | 1. Log in as `accounting`.<br>2. Check the `Contracts` page for the `New Contract` button.<br>3. Manually go to `/contracts/new` in the browser.<br>4. Repeat with `logistics`, `creative`, and `linen`. | Non-sales roles do not see the `New Contract` button.<br>Non-sales roles cannot access contract creation directly.<br>They are redirected instead of receiving a broken page. | Not Run |
| UAT-019 | 1. Log in as `sales`.<br>2. Open the contract form.<br>3. Search creative inventory, linen inventory, and stockroom inventory from the add-item dropdowns. | Inventory searches load successfully.<br>No `Access denied: insufficient permissions` error appears while loading dropdown items. | Not Run |
| UAT-020 | 1. Try saving a contract with missing required data such as missing client name, invalid email, invalid address, no event date, no package, or invalid quantities.<br>2. Try again until each validation path is checked. | The form blocks invalid submission.<br>Error messaging appears clearly.<br>No invalid contract record is created. | Not Run |

## Sign-Off Notes

Use this section after execution:

- tester name:
- date tested:
- build/version:
- overall result:
- blocking issues:
- approved for demo/UAT:
