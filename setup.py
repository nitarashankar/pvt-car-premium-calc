from setuptools import setup, find_packages

setup(
    name="pvt-car-premium-calc",
    version="0.1.0",
    description="Dynamic Private Car Premium Calculator",
    author="Premium Calculator Team",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.9",
    install_requires=[
        "openpyxl>=3.1.0",
        "pandas>=2.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
        ]
    },
    entry_points={
        "console_scripts": [
            "premium-calc=premium_calculator.cli:main",
        ],
    },
)
