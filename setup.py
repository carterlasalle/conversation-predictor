"""
Setup configuration for Social Stockfish.
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="social-stockfish",
    version="0.1.0",
    author="Carter Lasalle",
    author_email="carter@lasalle.com",
    description="A conversation optimization system using Monte Carlo Tree Search",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/carterlasalle/social-stockfish",
    packages=find_packages(exclude=["tests", "tests.*", "examples"]),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Communications :: Chat",
    ],
    python_requires=">=3.11",
    install_requires=[
        "aiohttp>=3.9.3",
        "asyncio>=3.4.3",
        "loguru>=0.7.2",
        "networkx>=3.2.1",
        "numpy>=1.26.4",
        "openai>=1.12.0",
        "pydantic>=2.6.3",
        "python-dotenv>=1.0.1",
        "tenacity>=8.2.3",
        "typing-extensions>=4.9.0",
    ],
    extras_require={
        "dev": [
            "pytest>=8.0.2",
            "pytest-asyncio>=0.23.5",
            "black>=24.2.0",
            "isort>=5.13.2",
            "mypy>=1.8.0",
            "pylint>=3.0.3",
        ],
    },
    entry_points={
        "console_scripts": [
            "social-stockfish=examples.basic_conversation:main",
        ],
    },
) 