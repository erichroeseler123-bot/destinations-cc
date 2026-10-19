# Welcome to New Orleans Tours — Image Permission Status

Date: 2026-08-09
Branch: `chore/new-orleans-image-source-manifest`

## Conclusion

Public FareHarbor documentation does **not** currently give us a clear blanket right, as a standard referral-link affiliate, to download operator photos and rehost them on WelcomeToNewOrleansTours.com.

There are three distinct facts in FareHarbor's current documentation:

1. The Custom Embed Generator supports an `Image URL` and instructs users to obtain that URL from an item's Listing → Photos in the FareHarbor Dashboard. The tool is described as especially useful for affiliates reselling items from multiple companies.
2. Approved **FHDN API affiliates** are expressly described as being able to display real-time availability, pricing, content, and photos from operators directly on their own platforms.
3. FareHarbor's Provider Terms say providers grant FareHarbor a license to use, reproduce, display, modify, distribute, sublicense, and transmit Provider Content — including images and photographs — solely for providing the FareHarbor Service. Providers retain ownership of Provider Content.

Those provisions are useful, but they do not plainly say that every referral-link affiliate may independently download and rehost any operator photo outside the FareHarbor embed/integration context.

## Practical rule for this project

Until FareHarbor or the operator confirms otherwise in writing:

- **Allowed / low-risk implementation path:** use FareHarbor's documented embed/image-URL mechanism only where it is part of an approved FareHarbor affiliate integration and passes FareHarbor QC.
- **Do not assume permission:** downloading an operator/FareHarbor image and committing it to our own `public/` directory.
- **Do not scrape:** FareHarbor's customer terms specifically exclude collection/use of images or third-party content and prohibit scraping/data extraction except where expressly permitted.
- **Operator website photos remain permission-pending:** a public operator page is a source lead, not a copyright license.

## Official documentation reviewed

### FareHarbor Custom Embed Generator

Official documentation:
- `https://help.fareharbor.com/hc/en-us/articles/40898520358939-FareHarbor-Custom-Embed-Generator`

Key result: the generator has an `Image URL` field. FareHarbor tells users to obtain the image address from Listing → Photos in the Dashboard. The generator is described as especially useful for affiliate companies reselling items from multiple companies.

Interpretation: this is strong support for using FareHarbor-hosted item-photo URLs **inside the documented embed workflow**. It is not explicit authorization to download/rehost the underlying asset ourselves.

### FareHarbor Distribution Network (FHDN) for affiliates

Official documentation:
- `https://help.fareharbor.com/hc/en-us/articles/42957556694811-FareHarbor-Distribution-Network-FHDN-for-affiliates`

Key result: FareHarbor distinguishes referral-link affiliates from API affiliates. It expressly says approved FHDN API partners can display operator content and photos directly on their own platforms.

Interpretation: API partners have a clearly documented photo/content display right as part of that integration. The same language is not stated for ordinary referral-link affiliates.

### FareHarbor Provider Terms — Provider Content

Official documentation:
- `https://fareharbor.com/legal/tos-providers/`

Key result: providers grant FareHarbor a broad license in Provider Content, including images and photographs, for the purpose of providing the FareHarbor Service. Providers retain ownership of their Provider Content.

Interpretation: FareHarbor may have the contractual ability to sublicense Provider Content in service of the FareHarbor Service, but our exact rights as a referral-link affiliate still need to be confirmed under our affiliate arrangement/integration.

### FareHarbor Customer Terms

Official documentation:
- `https://fareharbor.com/legal/tos-customers/`

Key result: the general customer license excludes collection/use of images or third-party content and prohibits scraping/data extraction unless expressly permitted.

Interpretation: do not build a crawler that harvests FareHarbor images merely because they are publicly reachable.

## Permission request sent

On 2026-08-09 an email was sent from the connected Gmail account to:

- `channelsupport@fareharbor.com`
- CC: `strategicpartnerships@fareharbor.com`

Subject:
`Affiliate image-use permission for Welcome to New Orleans Tours`

The request asks FareHarbor to confirm whether WelcomeToNewOrleansTours.com, operating as a FareHarbor affiliate, may:

1. use FareHarbor-hosted product-photo URLs in our own tour cards/detail/recommendation surfaces; and/or
2. download and host copies of operator product photos on our own site.

It also asks whether permission is operator-specific and requests the applicable Affiliate Participation Agreement, media-use policy, FHDN term, or other governing language.

Status: `AWAITING_FAREHARBOR_RESPONSE`

## Work that can continue while permission is pending

We do **not** need to stop the image project. While waiting for FareHarbor's answer we can:

1. finish mapping every current rendered image to its source and product;
2. identify the best operator/FareHarbor photo candidate for every tour without copying it;
3. remove clearly mismatched assignments in code by planning replacements;
4. optimize/replace oversized Wikimedia assets where their licenses are already verified;
5. prepare exact alt text and crop requirements;
6. build the image-data schema so source, rights, depiction type and attribution are enforced in code;
7. create a replacement queue that can be executed immediately once permission is confirmed.

## Deployment gate

Do not merge any commit that copies/rehosts operator or FareHarbor product photography until one of these is documented:

- FareHarbor confirms our referral-affiliate rights in writing;
- the relevant operator grants us written marketing/media permission; or
- the image has an independent license that clearly allows our intended commercial use.

Using an image through a FareHarbor-approved embed/image-URL integration may be handled separately if FareHarbor confirms that implementation is covered by the documented embed workflow.
