from django.db import migrations, models
from decimal import Decimal

GOVERNORATES = [
    "Cairo","Giza","Alexandria","Qalyubia","Port Said","Suez","Damietta",
    "Dakahlia","Sharqia","Kafr El Sheikh","Gharbia","Monufia","Beheira",
    "Ismailia","Faiyum","Beni Suef","Minya","Asyut","Sohag","Qena","Luxor",
    "Aswan","Red Sea","New Valley","Matrouh","North Sinai","South Sinai"
]
PRODUCTS = [
    ("Lilly Product 01","Cosmetics",True),("Lilly Product 02","Skincare",True),
    ("Lilly Product 03","Makeup",True),("Lilly Product 04","Lip Care",True),
    ("Lilly Product 05","Body Care",False),("Lilly Product 06","Makeup",False),
    ("Lilly Product 07","Bundles",False),("Lilly Product 08","Body care",False)
]
def seed(apps, schema_editor):
    Product = apps.get_model("store","Product")
    ShippingRate = apps.get_model("store","ShippingRate")
    if not Product.objects.exists():
        for name, category, bestseller in PRODUCTS:
            Product.objects.create(
                name=name, category=category, price=Decimal("0"), old_price=Decimal("0"),
                sizes=["S","M","L"], colors=["Pink","White","Black"],
                description="Add your product description here.", bestseller=bestseller
            )
    for city in GOVERNORATES:
        ShippingRate.objects.get_or_create(governorate=city, defaults={"price": Decimal("0")})

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200)),
                ("category", models.CharField(default="Skincare", max_length=100)),
                ("price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("old_price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("image", models.CharField(blank=True, default="", max_length=500)),
                ("gallery", models.JSONField(blank=True, default=list)),
                ("sizes", models.JSONField(blank=True, default=list)),
                ("colors", models.JSONField(blank=True, default=list)),
                ("description", models.TextField(blank=True, default="")),
                ("bestseller", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["id"]},
        ),
        migrations.CreateModel(
            name="ShippingRate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("governorate", models.CharField(max_length=100, unique=True)),
                ("price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
            ],
        ),
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("order_number", models.PositiveIntegerField(unique=True)),
                ("status", models.CharField(choices=[("Pending","Pending"),("Confirmed","Confirmed"),("Processing","Processing"),("Shipped","Shipped"),("Delivered","Delivered"),("Cancelled","Cancelled")], default="Pending", max_length=20)),
                ("customer", models.JSONField(default=dict)),
                ("items", models.JSONField(default=list)),
                ("subtotal", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("shipping", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("total", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.RunPython(seed, migrations.RunPython.noop),
    ]
