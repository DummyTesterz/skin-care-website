# LILLY SKIN CARE — Django version

This is the Django/database conversion of the supplied `Lilly_Skin_Care_JS_mobile_fixed_v2 (3).zip`.

## What was kept unchanged
- The existing customer-facing HTML/CSS design and mobile styling.
- The existing product detail page layout.
- The existing Admin Panel HTML/CSS and its buttons/layout.
- The existing product fields, categories, shipping-rate fields, and order statuses.
- Existing assets/images.

## What changed behind the scenes
The browser `localStorage` data layer was replaced with Django + database:
- Products are stored in `Product`.
- Shipping rates are stored in `ShippingRate`.
- Orders are stored in `Order`.
- Admin login is a server-side Django session.
- Product prices and shipping are recalculated on the server when an order is placed, so customers cannot edit the final price in browser developer tools.
- Admin product edits/deletes are immediately visible to all customers because everyone reads the same database.

## Run on Windows
1. Install Python 3.11+.
2. Open this folder in VS Code.
3. Run:
   ```
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```
4. Open:
   - Store: http://127.0.0.1:8000/
   - Admin Panel: http://127.0.0.1:8000/admin.html
5. Default admin credentials are:
   - Email: `hasnaa@12`
   - Password: `123`
   You can change them with `LILLY_ADMIN_EMAIL` and `LILLY_ADMIN_PASSWORD` environment variables before deployment.

## Adding product images
The original Admin Panel asks for an image path, so the same behavior is preserved.
For an image already inside `store/static/assets/`, enter for example:
`assets/cream1.jpeg`
The website will serve it as `/static/assets/cream1.jpeg`.

## Public deployment
`render.yaml` is included for a simple Render deployment. It creates a PostgreSQL database and a Django web service.
Set your admin email/password as secret environment variables on the hosting service.

For a custom domain, connect your domain in the hosting provider after the web service is live.

## Important
For a real public store, use a strong admin password and a unique `DJANGO_SECRET_KEY`. Do not keep `123` in production.

The included database is designed so that the same products, shipping rates, and orders are shared across all customers/devices.
