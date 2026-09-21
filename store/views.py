import json
import re
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Product, ShippingRate, Order

GOVERNORATES = [
    "Cairo","Giza","Alexandria","Qalyubia","Port Said","Suez","Damietta",
    "Dakahlia","Sharqia","Kafr El Sheikh","Gharbia","Monufia","Beheira",
    "Ismailia","Faiyum","Beni Suef","Minya","Asyut","Sohag","Qena","Luxor",
    "Aswan","Red Sea","New Valley","Matrouh","North Sinai","South Sinai"
]

DEFAULT_PRODUCTS = [
    {"id": 1, "name": "Lilly Product 01", "category": "Cosmetics", "price": 0, "oldPrice": 0, "image": "", "gallery": [], "sizes": ["S","M","L"], "colors": ["Pink","White","Black"], "description": "Add your product description here.", "bestseller": True},
    {"id": 2, "name": "Lilly Product 02", "category": "Skincare", "price": 0, "oldPrice": 0, "image": "", "gallery": [], "sizes": ["S","M","L"], "colors": ["Pink","White","Black"], "description": "Add your product description here.", "bestseller": True},
    {"id": 3, "name": "Lilly Product 03", "category": "Makeup", "price": 0, "oldPrice": 0, "image": "", "gallery": [], "sizes": ["S","M","L"], "colors": ["Pink","White","Black"], "description": "Add your product description here.", "bestseller": True},
    {"id": 4, "name": "Lilly Product 04", "category": "Lip Care", "price": 0, "oldPrice": 0, "image": "", "gallery": [], "sizes": ["S","M","L"], "colors": ["Pink","White","Black"], "description": "Add your product description here.", "bestseller": True},
    {"id": 5, "name": "Lilly Product 05", "category": "Body Care", "price": 0, "oldPrice": 0, "image": "", "gallery": [], "sizes": ["S","M","L"], "colors": ["Pink","White","Black"], "description": "Add your product description here.", "bestseller": False},
    {"id": 6, "name": "Lilly Product 06", "category": "Makeup", "price": 0, "oldPrice": 0, "image": "", "gallery": [], "sizes": ["S","M","L"], "colors": ["Pink","White","Black"], "description": "Add your product description here.", "bestseller": False},
    {"id": 7, "name": "Lilly Product 07", "category": "Bundles", "price": 0, "oldPrice": 0, "image": "", "gallery": [], "sizes": ["S","M","L"], "colors": ["Pink","White","Black"], "description": "Add your product description here.", "bestseller": False},
    {"id": 8, "name": "Lilly Product 08", "category": "Body care", "price": 0, "oldPrice": 0, "image": "", "gallery": [], "sizes": ["S","M","L"], "colors": ["Pink","White","Black"], "description": "Add your product description here.", "bestseller": False},
]

def _json(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return {}

def _decimal(value):
    try:
        return Decimal(str(value or 0))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal("0")

def _asset_path(value):
    value = str(value or "").strip()
    if not value:
        return ""
    if value.startswith("/static/"):
        return value
    if value.startswith("static/"):
        return "/" + value
    if value.startswith("assets/"):
        return "/static/" + value
    return value

def _stored_asset_path(value):
    value = str(value or "").strip()
    value = re.sub(r"^/static/", "", value)
    value = re.sub(r"^static/", "", value)
    return value

def serialize_product(p):
    return {
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "price": float(p.price),
        "oldPrice": float(p.old_price),
        "image": _asset_path(p.image),
        "gallery": [_asset_path(x) for x in (p.gallery or [])],
        "sizes": p.sizes or [],
        "colors": p.colors or [],
        "description": p.description,
        "bestseller": p.bestseller,
    }

def serialize_order(o):
    return {
        "id": o.id,
        "orderNumber": o.order_number,
        "status": o.status,
        "customer": o.customer or {},
        "items": o.items or [],
        "subtotal": float(o.subtotal),
        "shipping": float(o.shipping),
        "total": float(o.total),
        "createdAt": o.created_at.isoformat(),
        "updatedAt": o.updated_at.isoformat(),
    }

def _admin_required(request):
    if not request.session.get("lilly_admin"):
        return JsonResponse({"error": "Unauthorized"}, status=401)
    return None

def home(request):
    products = [serialize_product(p) for p in Product.objects.all()]
    shipping = {r.governorate: float(r.price) for r in ShippingRate.objects.all()}
    return render(request, "index.html", {"products": products, "shipping": shipping})

def product(request):
    products = [serialize_product(p) for p in Product.objects.all()]
    shipping = {r.governorate: float(r.price) for r in ShippingRate.objects.all()}
    return render(request, "product.html", {"products": products, "shipping": shipping})

def admin_panel(request):
    return render(request, "admin.html")

@csrf_exempt
@require_http_methods(["POST"])
def login_api(request):
    data = _json(request)
    if data.get("email") == settings.ADMIN_EMAIL and data.get("password") == settings.ADMIN_PASSWORD:
        request.session["lilly_admin"] = True
        request.session.set_expiry(60 * 60 * 12)
        return JsonResponse({"ok": True})
    return JsonResponse({"error": "Wrong email or password."}, status=401)

@csrf_exempt
@require_http_methods(["POST"])
def logout_api(request):
    request.session.flush()
    return JsonResponse({"ok": True})

@require_http_methods(["GET"])
def session_api(request):
    return JsonResponse({"authenticated": bool(request.session.get("lilly_admin"))})

@csrf_exempt
@require_http_methods(["POST", "PUT", "DELETE"])
def product_api(request, pk):
    auth = _admin_required(request)
    if auth: return auth
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found."}, status=404)

    if request.method == "DELETE":
        product.delete()
        return JsonResponse({"ok": True})

    data = _json(request)
    product.name = str(data.get("name", product.name)).strip()
    product.category = str(data.get("category", product.category)).strip() or "Skincare"
    product.price = _decimal(data.get("price", product.price))
    product.old_price = _decimal(data.get("oldPrice", product.old_price))
    product.image = _stored_asset_path(data.get("image", product.image))
    product.gallery = [_stored_asset_path(x) for x in (data.get("gallery") or [])]
    product.sizes = data.get("sizes") or []
    product.colors = data.get("colors") or []
    product.description = str(data.get("description", product.description))
    product.bestseller = bool(data.get("bestseller", product.bestseller))
    product.save()
    return JsonResponse({"product": serialize_product(product)})

@csrf_exempt
@require_http_methods(["GET", "POST"])
def products_api(request):
    # GET and POST share this endpoint to preserve the simple admin JS.
    if request.method == "GET":
        return JsonResponse({"products": [serialize_product(p) for p in Product.objects.all()]})
    auth = _admin_required(request)
    if auth: return auth
    data = _json(request)
    product = Product.objects.create(
        name=str(data.get("name", "")).strip() or "Unnamed Product",
        category=str(data.get("category", "Skincare")).strip() or "Skincare",
        price=_decimal(data.get("price", 0)),
        old_price=_decimal(data.get("oldPrice", 0)),
        image=_stored_asset_path(data.get("image", "")),
        gallery=[_stored_asset_path(x) for x in (data.get("gallery") or [])],
        sizes=data.get("sizes") or [],
        colors=data.get("colors") or [],
        description=str(data.get("description", "")),
        bestseller=bool(data.get("bestseller", False)),
    )
    return JsonResponse({"product": serialize_product(product)}, status=201)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def shipping_api(request):
    if request.method == "GET":
        return JsonResponse({"shipping": {r.governorate: float(r.price) for r in ShippingRate.objects.all()}})
    auth = _admin_required(request)
    if auth: return auth
    data = _json(request)
    rates = data.get("shipping") or {}
    with transaction.atomic():
        for city in GOVERNORATES:
            ShippingRate.objects.update_or_create(
                governorate=city,
                defaults={"price": _decimal(rates.get(city, 0))}
            )
    return JsonResponse({"ok": True})

@csrf_exempt
@require_http_methods(["GET", "POST"])
def orders_api(request):
    if request.method == "GET":
        auth = _admin_required(request)
        if auth: return auth
        return JsonResponse({"orders": [serialize_order(o) for o in Order.objects.all()]})

    data = _json(request)
    customer = data.get("customer") or {}
    items = data.get("items") or []
    if not customer.get("name") or not customer.get("phone") or not customer.get("address") or not customer.get("governorate"):
        return JsonResponse({"error": "Please fill in all required order details."}, status=400)
    if not items:
        return JsonResponse({"error": "Your cart is empty."}, status=400)

    # Recalculate prices from the database, so customers cannot edit product prices in the browser.
    clean_items = []
    subtotal = Decimal("0")
    for item in items:
        try:
            product = Product.objects.get(pk=int(item.get("productId")))
            quantity = max(1, int(item.get("quantity", 1)))
        except (Product.DoesNotExist, TypeError, ValueError):
            continue
        price = product.price
        line_total = price * quantity
        subtotal += line_total
        clean_items.append({
            "productId": product.id,
            "name": product.name,
            "price": float(price),
            "quantity": quantity,
            "size": str(item.get("size") or ""),
            "color": str(item.get("color") or ""),
            "lineTotal": float(line_total),
        })
    if not clean_items:
        return JsonResponse({"error": "Your cart has no valid products."}, status=400)

    city = str(customer.get("governorate"))
    shipping = ShippingRate.objects.filter(governorate=city).values_list("price", flat=True).first()
    shipping = shipping if shipping is not None else Decimal("0")
    total = subtotal + shipping

    with transaction.atomic():
        last = Order.objects.select_for_update().order_by("-order_number").first()
        order_number = max(1024, last.order_number if last else 1024) + 1
        order = Order.objects.create(
            order_number=order_number,
            status="Pending",
            customer={
                "name": str(customer.get("name") or ""),
                "phone": str(customer.get("phone") or ""),
                "address": str(customer.get("address") or ""),
                "governorate": city,
                "notes": str(customer.get("notes") or ""),
            },
            items=clean_items,
            subtotal=subtotal,
            shipping=shipping,
            total=total,
        )
    return JsonResponse({"orderNumber": order.order_number, "id": order.id}, status=201)

@csrf_exempt
@require_http_methods(["PATCH", "DELETE"])
def order_api(request, pk):
    auth = _admin_required(request)
    if auth: return auth
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found."}, status=404)

    if request.method == "DELETE":
        order.delete()
        return JsonResponse({"ok": True})

    data = _json(request)
    status = data.get("status")
    allowed = {x[0] for x in Order.STATUS_CHOICES}
    if status not in allowed:
        return JsonResponse({"error": "Invalid order status."}, status=400)
    order.status = status
    order.save(update_fields=["status", "updated_at"])
    return JsonResponse({"order": serialize_order(order)})
