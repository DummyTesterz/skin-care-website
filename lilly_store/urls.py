from django.urls import path
from store import views

urlpatterns = [
    path("", views.home, name="home"),
    path("product.html", views.product, name="product"),
    path("admin.html", views.admin_panel, name="admin-panel"),
    path("admin-panel/", views.admin_panel, name="admin-panel-alt"),

    path("api/auth/login/", views.login_api, name="login-api"),
    path("api/auth/logout/", views.logout_api, name="logout-api"),
    path("api/auth/session/", views.session_api, name="session-api"),

    path("api/products/", views.products_api, name="products-api"),
    path("api/products/<int:pk>/", views.product_api, name="product-api"),
    path("api/shipping/", views.shipping_api, name="shipping-api"),
    path("api/orders/", views.orders_api, name="orders-api"),
    path("api/orders/<int:pk>/", views.order_api, name="order-api"),
]
